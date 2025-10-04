# Bharat FoodTrace - Step 3: Blockchain Integration

This guide will walk you through deploying the `Traceability` smart contract to the Polygon Mumbai testnet and connecting it to your backend.

### Prerequisites

1.  **MetaMask:** You must have the [MetaMask browser extension](https://metamask.io/) installed.
2.  **Node.js & npm:** Required for the blockchain deployment scripts.

### Step 3.1: Get a Wallet and Test Funds

1.  **Create a Wallet:** Open MetaMask and create a new wallet if you don't have one. **Securely back up your Secret Recovery Phrase.**
2.  **Get your Private Key:**
    * In MetaMask, click the three dots `(...)` and select "Account details".
    * Click "Show private key", enter your password, and copy your private key. **NEVER SHARE THIS KEY WITH ANYONE.**
3.  **Add the Polygon Mumbai Network:**
    * Go to [Chainlist](https://chainlist.org/?testnets=true&search=mumbai) and search for "Mumbai".
    * Click "Add to MetaMask" for the Polygon Mumbai network and approve it.
4.  **Get Test MATIC (Faucet):**
    * Go to the official [Polygon Faucet](https://faucet.polygon.technology/).
    * Select the "Mumbai" network, "MATIC Token", and paste your wallet address.
    * Click "Submit". You will receive some test MATIC in your wallet shortly. This is needed to pay for the contract deployment.

### Step 3.2: Set Up the Blockchain Project

1.  **Open a NEW terminal** and navigate into the `blockchain` directory:
    ```bash
    cd /path/to/your/project/bharat-foodtrace/blockchain
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create an environment file** in the `blockchain` directory named `.env`:
    * You can use the command `nano .env`
4.  **Add the following content** to your `.env` file. Replace the placeholder values with your own:
    ```
    # Get this from a service like Infura or Alchemy
    POLYGON_MUMBAI_RPC_URL="[https://rpc-mumbai.maticvigil.com/](https://rpc-mumbai.maticvigil.com/)"

    # This is the private key you copied from MetaMask
    SERVER_PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY"
    ```

### Step 3.3: Deploy the Smart Contract

1.  While in the `blockchain` directory, run the deployment script:
    ```bash
    npx hardhat run scripts/deploy.js --network mumbai
    ```
2.  After a minute, the script will output a message like: `Traceability contract deployed to: 0x...`
3.  **Copy this contract address.** This is the permanent address of your new smart contract on the blockchain.

### Step 3.4: Configure the Backend

1.  Go to your **backend** directory (`bharat-foodtrace/backend`).
2.  **Install the new dependency:**
    ```bash
    # Make sure your virtual environment is active
    source venv/bin/activate
    pip install web3
    ```
3.  **Update your `.env` file** in the `backend` directory. Add these new lines, pasting in the values you have:
    ```
    # Add these new lines to your existing backend/.env file

    # Same RPC URL as in the blockchain/.env file
    BLOCKCHAIN_RPC_URL="[https://rpc-mumbai.maticvigil.com/](https://rpc-mumbai.maticvigil.com/)"

    # The contract address you copied from the deployment script
    CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS"

    # The SAME private key from your MetaMask wallet
    SERVER_PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY"

    # The Chain ID for Polygon Mumbai is 80001
    CHAIN_ID=80001
    ```

### Step 3.5: Run the Full Application

1.  **Start the Backend:** In your backend terminal, run `uvicorn main:app --reload`.
2.  **Start the Frontend:** In your frontend terminal, run `npm run dev`.
3.  **Test the End-to-End Flow:**
    * Go to the **Manufacturer Portal**, create a new product, and get its Product ID.
    * Go to the **Logistics Portal** and submit a traceability update for that Product ID.
    * Check your **backend terminal**. You will see a `!!! BLOCKCHAIN ERROR !!!` if something went wrong, otherwise it worked.
    * Go to the **Consumer Portal**, log in, and scan for that same Product ID.
    * In the traceability log, you will now see a **"Verify on Polygon"** link. Click it!
    * This will open the PolygonScan block explorer, showing you the immutable, public proof of your transaction.
