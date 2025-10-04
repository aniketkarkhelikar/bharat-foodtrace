const hre = require("hardhat");

async function main() {
  const Traceability = await hre.ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();

  await traceability.waitForDeployment();

  console.log(`Traceability contract deployed to: ${traceability.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
