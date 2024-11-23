import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";


// Helper function to mine a specific number of blocks
export const mineBlocks = async (numberOfBlocks : number) => {
  for (let i = 0; i < numberOfBlocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
};


// This is done, because `signer.address` does not match the account in the error due to case of letters.
/**
 * Tests that a call to a specific method reverts when performed by a non-admin account.
 *
 * This function simulates a scenario where a non-admin attempts to call a restricted method
 * (e.g., `grantRole`, `revokeRole`). It ensures the transaction reverts with the correct
 * error message and validates the expected address in the error.
 *
 * @param account -
 * The account attempting the restricted action.
 * This account should not have the required admin role.
 * @param token - The ERC20 or ERC721 token contract where the method will be called.
 * @param method - The name of the method being tested (e.g., `grantRole`, `revokeRole`).
 * @param params - The arguments to be passed to the method. Defaults to an empty array.
 * @param expectedErrorRole - The admin role that the account is missing, used in the error validation.
 *
 * @throws Will throw an error if the transaction does not revert as expected or if the error message
 * does not match the expected format.
 */
export const expectRevertWhenNonAdminCallsMethod = async ({
  account,
  token,
  method,
  params = [],
  expectedErrorRole,
} : {
  account : HardhatEthersSigner;
  token : any;
  method : string;
  params ?: Array<string>;
  expectedErrorRole : string;
}) => {
  // add var to ensure that the test will fail if #method runs without returning an error
  let unexpectedBehavior = false;

  try {
    await token.connect(account)[method](...params);

    // change it if try block is passed without an error
    unexpectedBehavior = true;
  } catch (error) {
    const errorMessage = error.message;

    // regular expression to find an address
    const addressMatch = errorMessage.match(/account (0x[a-fA-F0-9]{40})/);

    if (!addressMatch) {
      throw new Error("Regular expression ERROR: 'No address found in the error message'");
    } else {
      // make them lowercase because the error returns addresses with different cases
      const errAddress = addressMatch[1].toLowerCase();
      const expectedAddress = account.address.toLowerCase();

      expect(
        errorMessage
      ).to.eq(
        "VM Exception while processing transaction: reverted with reason string" +
        ` 'AccessControl: account ${errAddress} is missing role ${expectedErrorRole}'`
      );

      expect(
        errAddress
      ).to.equal(
        expectedAddress
      );
    }
  }

  expect(
    unexpectedBehavior,
    "The `try` block passed without reverting an error, as expected"
  ).to.be.false;
};