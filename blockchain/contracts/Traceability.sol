// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Traceability
 * @dev A simple smart contract to anchor traceability event hashes on the blockchain.
 * This contract creates a public, immutable, and verifiable log of data fingerprints.
 */
contract Traceability {
    // Mapping from a product batch ID (bytes32) to an array of event hashes (bytes32)
    mapping(bytes32 => bytes32[]) private traceEvents;

    // Event to be emitted when a new hash is recorded
    event EventRecorded(
        bytes32 indexed productBatchId,
        bytes32 eventHash,
        address recorder,
        uint256 timestamp
    );

    /**
     * @dev Records a new traceability event hash for a given product batch.
     * Only the owner (the backend server) can call this function.
     * @param _productBatchId A unique identifier for the product batch.
     * @param _eventHash The SHA-256 hash of the off-chain event data.
     */
    function recordTraceEvent(
        bytes32 _productBatchId,
        bytes32 _eventHash
    ) external {
        // Add the new event hash to the array for the given product batch
        traceEvents[_productBatchId].push(_eventHash);

        // Emit an event to log the action on the blockchain
        emit EventRecorded(
            _productBatchId,
            _eventHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Retrieves all event hashes for a given product batch ID.
     * This is a public view function that anyone can call for free.
     * @param _productBatchId The unique identifier for the product batch to query.
     * @return An array of event hashes.
     */
    function getTraceEvents(
        bytes32 _productBatchId
    ) external view returns (bytes32[] memory) {
        return traceEvents[_productBatchId];
    }
}
