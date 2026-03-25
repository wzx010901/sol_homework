import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("NFT Contract", function () {
  async function deployNFTFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const nft = await hre.viem.deployContract("NFT", [
      "Test NFT",
      "TNFT",
      "https://api.example.com/metadata/",
    ]);

    return {
      nft,
      owner,
      addr1,
      addr2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { nft } = await deployNFTFixture();

      expect(await nft.read.name()).to.equal("Test NFT");
      expect(await nft.read.symbol()).to.equal("TNFT");
    });

    it("Should set the correct owner", async function () {
      const { nft, owner } = await deployNFTFixture();

      expect(await nft.read.owner()).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const { nft, addr1, publicClient } = await deployNFTFixture();

      const tx = await nft.write.mint([addr1.account.address, "token-uri-1"]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      expect(await nft.read.balanceOf([addr1.account.address])).to.equal(1n);
      expect(await nft.read.ownerOf([0n])).to.equal(getAddress(addr1.account.address));
      expect(await nft.read.tokenURI([0n])).to.equal("https://api.example.com/metadata/token-uri-1");
    });

    it("Should allow owner to mint multiple tokens", async function () {
      const { nft, addr1, addr2, publicClient } = await deployNFTFixture();

      const tx1 = await nft.write.mint([addr1.account.address, "token-uri-1"]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      const tx2 = await nft.write.mint([addr2.account.address, "token-uri-2"]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      expect(await nft.read.balanceOf([addr1.account.address])).to.equal(1n);
      expect(await nft.read.balanceOf([addr2.account.address])).to.equal(1n);
      expect(await nft.read.ownerOf([0n])).to.equal(getAddress(addr1.account.address));
      expect(await nft.read.ownerOf([1n])).to.equal(getAddress(addr2.account.address));
    });
  });

  describe("Transfers", function () {
    it("Should transfer token between accounts", async function () {
      const { nft, addr1, addr2, publicClient } = await deployNFTFixture();

      const mintTx = await nft.write.mint([addr1.account.address, "token-uri-1"]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });

      const transferTx = await nft.write.transferFrom(
        [addr1.account.address, addr2.account.address, 0n],
        { account: addr1.account }
      );
      await publicClient.waitForTransactionReceipt({ hash: transferTx });

      expect(await nft.read.ownerOf([0n])).to.equal(getAddress(addr2.account.address));
      expect(await nft.read.balanceOf([addr1.account.address])).to.equal(0n);
      expect(await nft.read.balanceOf([addr2.account.address])).to.equal(1n);
    });
  });
});
