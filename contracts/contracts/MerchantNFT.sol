// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MerchantNFT
 * @dev NFT representing a player's merchant character in MerchantQuest
 */
contract MerchantNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    
    // Merchant stats
    struct Merchant {
        string name;
        uint256 level;
        uint256 experience;
        uint256 gold;
        uint256 currentCity;
        uint256 totalTrades;
        uint256 totalProfit;
        uint256 createdAt;
    }
    
    // Mapping from token ID to Merchant data
    mapping(uint256 => Merchant) public merchants;
    
    // Mapping from address to their merchant token ID
    mapping(address => uint256) public playerMerchant;
    
    // Game contract address (can modify merchant stats)
    address public gameContract;
    
    // Events
    event MerchantCreated(uint256 indexed tokenId, address indexed owner, string name);
    event MerchantLevelUp(uint256 indexed tokenId, uint256 newLevel);
    event MerchantStatsUpdated(uint256 indexed tokenId);
    
    // Experience required per level (cumulative)
    uint256[] public levelThresholds = [
        0,      // Level 1
        100,    // Level 2
        300,    // Level 3
        600,    // Level 4
        1000,   // Level 5
        1500,   // Level 6
        2100,   // Level 7
        2800,   // Level 8
        3600,   // Level 9
        4500    // Level 10
    ];
    
    constructor() ERC721("MerchantQuest Hero", "MQHERO") Ownable(msg.sender) {}
    
    /**
     * @dev Set the game contract address
     */
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }
    
    /**
     * @dev Modifier to allow only game contract or owner
     */
    modifier onlyGameOrOwner() {
        require(
            msg.sender == gameContract || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    
    /**
     * @dev Create a new merchant for a player
     */
    function createMerchant(string memory name) external returns (uint256) {
        require(playerMerchant[msg.sender] == 0, "Already have a merchant");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        
        _nextTokenId++;
        uint256 tokenId = _nextTokenId;
        
        _safeMint(msg.sender, tokenId);
        
        merchants[tokenId] = Merchant({
            name: name,
            level: 1,
            experience: 0,
            gold: 1000, // Starting gold
            currentCity: 0, // Start at first city
            totalTrades: 0,
            totalProfit: 0,
            createdAt: block.timestamp
        });
        
        playerMerchant[msg.sender] = tokenId;
        
        emit MerchantCreated(tokenId, msg.sender, name);
        
        return tokenId;
    }
    
    /**
     * @dev Add experience to merchant and handle level up
     */
    function addExperience(uint256 tokenId, uint256 amount) external onlyGameOrOwner {
        require(_ownerOf(tokenId) != address(0), "Merchant does not exist");
        
        Merchant storage merchant = merchants[tokenId];
        merchant.experience += amount;
        
        // Check for level up
        uint256 newLevel = calculateLevel(merchant.experience);
        if (newLevel > merchant.level) {
            merchant.level = newLevel;
            emit MerchantLevelUp(tokenId, newLevel);
        }
        
        emit MerchantStatsUpdated(tokenId);
    }
    
    /**
     * @dev Calculate level based on experience
     */
    function calculateLevel(uint256 experience) public view returns (uint256) {
        for (uint256 i = levelThresholds.length - 1; i > 0; i--) {
            if (experience >= levelThresholds[i]) {
                return i + 1;
            }
        }
        return 1;
    }
    
    /**
     * @dev Update merchant gold
     */
    function updateGold(uint256 tokenId, uint256 newGold) external onlyGameOrOwner {
        require(_ownerOf(tokenId) != address(0), "Merchant does not exist");
        merchants[tokenId].gold = newGold;
        emit MerchantStatsUpdated(tokenId);
    }
    
    /**
     * @dev Update merchant city
     */
    function updateCity(uint256 tokenId, uint256 cityId) external onlyGameOrOwner {
        require(_ownerOf(tokenId) != address(0), "Merchant does not exist");
        merchants[tokenId].currentCity = cityId;
        emit MerchantStatsUpdated(tokenId);
    }
    
    /**
     * @dev Record a trade
     */
    function recordTrade(uint256 tokenId, int256 profit) external onlyGameOrOwner {
        require(_ownerOf(tokenId) != address(0), "Merchant does not exist");
        
        Merchant storage merchant = merchants[tokenId];
        merchant.totalTrades++;
        
        if (profit > 0) {
            merchant.totalProfit += uint256(profit);
        }
        
        emit MerchantStatsUpdated(tokenId);
    }
    
    /**
     * @dev Get merchant data
     */
    function getMerchant(uint256 tokenId) external view returns (Merchant memory) {
        require(_ownerOf(tokenId) != address(0), "Merchant does not exist");
        return merchants[tokenId];
    }
    
    /**
     * @dev Get merchant by player address
     */
    function getMerchantByPlayer(address player) external view returns (uint256, Merchant memory) {
        uint256 tokenId = playerMerchant[player];
        require(tokenId != 0, "Player has no merchant");
        return (tokenId, merchants[tokenId]);
    }
    
    /**
     * @dev Check if player has a merchant
     */
    function hasMerchant(address player) external view returns (bool) {
        return playerMerchant[player] != 0;
    }
    
    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
