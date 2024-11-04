import { ethers } from "hardhat";
import { expect, version } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  ERC20,
  ERC20__factory,
  ERC721,
  ERC721__factory,
  MockERC20Votes,
  MockERC20Votes__factory,
  MockERC721Votes,
  MockERC721Votes__factory,
} from "../typechain-types";

interface ContractInfo {
  tokenName : string;
  tokenSymbol : string;
  isERC20 : boolean;
  version ?: string;
}

// mocks inherit voting contracts and have only #mint method, so we use them for tests
const contracts : Array<ContractInfo> = [
  { tokenName: "MockERC20Votes", tokenSymbol: "ZV", isERC20: true },
  { tokenName: "MockERC721Votes", tokenSymbol: "ZVNFT", isERC20: false, version: "1.0" },
];

// making forEach here to run similar tests for both standarts (ERC20 and NFT)
contracts.forEach(({ tokenName, tokenSymbol, isERC20 }) => {
  describe(`${isERC20 ? "ERC20 Voting" : "ERC721 Voting"} Tests`, () => {
    let votingToken : MockERC20Votes | MockERC721Votes;
    let VotingFactory : MockERC20Votes__factory | MockERC721Votes__factory;

    let owner : HardhatEthersSigner;
    let addr1 : HardhatEthersSigner;
    let addr2 : HardhatEthersSigner;

    const mintAmount = ethers.parseEther("150");
    const burnAmount = ethers.parseEther("100");
    const transferAmount = ethers.parseEther("50");
    const tokenId = 1;

    before(async () => {
      VotingFactory = await ethers.getContractFactory(tokenName) as MockERC20Votes__factory | MockERC721Votes__factory;
      [owner, addr1, addr2] = await ethers.getSigners();

      votingToken = isERC20
        ? await (VotingFactory as ERC20__factory).deploy(tokenName, tokenSymbol, owner)
        : await (VotingFactory as ERC721__factory).deploy(tokenName, tokenSymbol, version);

      await votingToken.waitForDeployment();

      if (isERC20) {
        await votingToken.connect(owner).mint(owner.address, ethers.parseEther("1000"));
        await (votingToken as ERC20).connect(owner).transfer(addr1.address, ethers.parseEther("100"));
        await (votingToken as ERC20).connect(owner).transfer(addr2.address, ethers.parseEther("50"));
      } else {
        await (votingToken as ERC721).connect(owner).mint(owner.address, tokenId);
        await (votingToken as ERC721).connect(owner).mint(addr1.address, tokenId + 1);
      }
    });

    it("Should correctly set name of contract and symbol", async () => {
      expect(
        await votingToken.name()
      ).to.equal(
        tokenName
      );
      expect(
        await votingToken.symbol()
      ).to.equal(
        tokenSymbol
      );
    });

    it.skip("Should allow owner to mint tokens", async () => {
      if (isERC20) {
        const balBefore = await (votingToken as ERC20).balanceOf(addr2.address);

        expect(
          await (votingToken as ERC20).balanceOf(addr2.address)
        ).to.equal(
          balBefore
        );
      } else {
        const newTokenId = tokenId + 2;
        await (votingToken as ERC721).connect(owner).mint(addr1.address, newTokenId);

        expect(
          await (votingToken as ERC721).ownerOf(newTokenId)
        ).to.equal(
          addr1.address
        );
      }
    });

    it.skip("Should not allow non-owner to mint tokens", async () => {
      if (isERC20) {
        await expect(
          (votingToken as ERC20).connect(addr1).mint(addr1.address, mintAmount)
        ).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      }
    });

    it("Should delegate votes", async () => {
      const balBefore = await (votingToken as ERC20).balanceOf(owner.address);

      await votingToken.connect(owner).delegate(owner.address);

      const votes = await votingToken.getVotes(owner.address);
      expect(
        votes
      ).to.eq(
        balBefore
      );
    });

    if (isERC20) {
      it("Should correctly update votes after TRANSFER", async () => {
        const balBefore = await (votingToken as ERC20).balanceOf(addr1.address);

        await (votingToken as ERC20).connect(addr1).delegate(addr1.address);
        const addr1Votes = await (votingToken as ERC20).getVotes(addr1.address);

        expect(
          addr1Votes
        ).to.equal(
          balBefore
        );

        // making transfer
        await (votingToken as ERC20).connect(addr1).transfer(addr2.address, transferAmount);
        const addr1VotesAfterTransfer = await (votingToken as ERC20).getVotes(addr1.address);

        expect(
          addr1VotesAfterTransfer
        ).to.equal(
          balBefore - transferAmount
        );
      });

      it("Should correctly update votes after BURN", async () => {
        // making another mint, because wallet doesn'thave enough tokens
        await (votingToken as ERC20).connect(owner).mint(addr1.address, mintAmount);
        const balBefore = await (votingToken as ERC20).balanceOf(addr1.address);

        // burn
        await (votingToken as ERC20).connect(addr1).burn(addr1.address, burnAmount);
        const addr1VotesAfterBurn = await (votingToken as ERC20).getVotes(addr1.address);

        expect(
          addr1VotesAfterBurn
        ).to.equal(
          balBefore - burnAmount
        );
      });
    } else {
      it("ERC721 Should update votes after transferring NFT", async () => {
        // 1 NFT = 1 vote
        const votesPerToken = 1n;
        const votesBefore = await votingToken.getVotes(owner.address);

        // making transfer
        await (votingToken as ERC721).connect(owner).transferFrom(owner.address, addr1.address, tokenId);
        const votesAfter = await votingToken.getVotes(owner.address);

        expect(
          votesAfter
        ).to.eq(
          votesBefore - votesPerToken
        );
      });
    }
  });
});
