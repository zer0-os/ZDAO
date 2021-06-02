const { expectRevert } = require('@openzeppelin/test-helpers');
const { toEthSignedMessageHash, fixSignature } = require('./helpers/sign');

const { expect } = require('chai');

const zAuction = artifacts.require('zAuction');
const nftcontract = artifacts.require('ERC721TestToken');
const erc20 = artifacts.require('ERC20TestToken')

const TEST_MESSAGE = web3.utils.sha3('OpenZeppelin');
const WRONG_MESSAGE = web3.utils.sha3('Nope');

contract('ZDao', function (accounts) {
  const [ other ] = accounts;
  console.log(other);
  before(async function (){

  })
  beforeEach(async function () {

  });

  context('', function () {
    it('', async function () {

    });
  });
});