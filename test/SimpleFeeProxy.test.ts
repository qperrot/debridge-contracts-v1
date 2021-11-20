import { ContractFactory } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { DeBridgeGate, SimpleFeeProxy, ERC20 } from '../typechain-types';
import {deployMockContract, MockContract, Stub} from '@ethereum-waffle/mock-contract';
import DeBridgeGateJson from '../artifacts/contracts/transfers/DeBridgeGate.sol/DeBridgeGate.json';
import ERC20Json from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { arrayify, Bytes } from '@ethersproject/bytes';
import { before } from 'mocha';
import expectStubFunctionIsCalledWith from './utils/expectStubFunctionIsCalledWith';

type DeBridgeGateMock = MockContract & {mock: { [K in keyof DeBridgeGate['functions']]: Stub }};
type ERC20Mock = MockContract & {mock: { [K in keyof ERC20['functions']]: Stub }};

let simpleFeeProxyFactory: ContractFactory;
let simpleFeeProxy: SimpleFeeProxy;
let deployer: SignerWithAddress;
let treasury: SignerWithAddress;
let user: SignerWithAddress;
let native: SignerWithAddress;
let CHAIN_ID: number;

before(async () => {
    [deployer, treasury, user, native] = await ethers.getSigners();
    CHAIN_ID =  (await ethers.provider.getNetwork()).chainId;
});

beforeEach(async () => {
    simpleFeeProxyFactory = await ethers.getContractFactory("SimpleFeeProxy", deployer);
    simpleFeeProxy = await upgrades.deployProxy(simpleFeeProxyFactory, []) as SimpleFeeProxy;
    await simpleFeeProxy.setTreasury(treasury.address);
});

it('grants DEFAULT_ADMIN_ROLE only to a deployer', async () => {
    const DEFAULT_ADMIN_ROLE = await simpleFeeProxy.DEFAULT_ADMIN_ROLE();
    const isDeployerAdmin = await simpleFeeProxy.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const isUserAdmin = await simpleFeeProxy.hasRole(DEFAULT_ADMIN_ROLE, user.address);
    expect(isDeployerAdmin).to.be.true;
    expect(isUserAdmin).to.be.false;
})

describe('withdrawFee', () => {
    let deBridgeGateMock: DeBridgeGateMock;
    let erc20Mock: ERC20Mock;
    let NATIVE_ADDRESS: Bytes;
    
    before(() => {
        NATIVE_ADDRESS = arrayify(native.address);
    })

    beforeEach(async () => {
        erc20Mock = await deployMockContract(deployer, ERC20Json.abi) as ERC20Mock;
        await erc20Mock.mock.balanceOf.returns(0 as any);
        await erc20Mock.mock.transfer.returns(true as any);

        deBridgeGateMock = await deployMockContract(deployer, DeBridgeGateJson.abi) as DeBridgeGateMock;
        await deBridgeGateMock.mock.getNativeTokenInfo
            .withArgs(erc20Mock.address)
            .returns(CHAIN_ID, NATIVE_ADDRESS);
        await deBridgeGateMock.mock.withdrawFee.returns();

        await simpleFeeProxy.setDebridgeGate(deBridgeGateMock.address);
    })

    it('reverts on 0 treasury address', async () => {
        await expect(
            simpleFeeProxy.withdrawFee(erc20Mock.address)
        ).not.to.be.revertedWith("EmptyTreasuryAddress()");

        await simpleFeeProxy.setTreasury(ethers.constants.AddressZero);
        await expect(
            simpleFeeProxy.withdrawFee(erc20Mock.address)
        ).to.be.revertedWith("EmptyTreasuryAddress()");
    })

    it('calls withdrawFee with correct id', async () => {
        const correctId = ethers.utils.solidityKeccak256(
            ['uint256', 'bytes'], [CHAIN_ID, NATIVE_ADDRESS]
        );

        await expectStubFunctionIsCalledWith(
            deBridgeGateMock.mock.withdrawFee,
            [correctId],
            async () => simpleFeeProxy.withdrawFee(erc20Mock.address),
        )        
    })

    it('transfers correct amount to treasury', async () => {
        const BALANCE_OF_SIMPLE_FEE_PROXY = 1234567890;

        erc20Mock.mock.balanceOf.withArgs(simpleFeeProxy.address)
            .returns(BALANCE_OF_SIMPLE_FEE_PROXY);

        await expectStubFunctionIsCalledWith(
            erc20Mock.mock.transfer,
            [treasury.address, BALANCE_OF_SIMPLE_FEE_PROXY],
            async () => simpleFeeProxy.withdrawFee(erc20Mock.address)
        )
    })
})