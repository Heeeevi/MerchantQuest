// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle - Interface for Price Oracles
 * @dev Common interface for PriceOracle and PriceOracleV2
 */
interface IPriceOracle {
    function getPrice(uint256 commodityId) external view returns (uint256);
    function getAllPrices() external view returns (uint256[] memory);
    function getCommodityName(uint256 commodityId) external view returns (string memory);
}
