// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "../libraries/SafeMath.sol";
import "../libraries/SafeERC20.sol";

import "../interfaces/IERC20.sol";
import "../interfaces/IERC1155.sol";
import "./IParagonBondingTreasury.sol";

import "../types/Ownable.sol";

/// @title   Parallel Bonding Contract
/// @author  JeffX
/// @notice  Bonding Parallel ERC1155s in return for PDT tokens
contract ParallelBondingContract is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /// EVENTS ///

    /// @notice Emitted when A bond is created
    /// @param deposit Address of where bond is deposited to
    /// @param payout Amount of PDT to be paid out
    /// @param expires Block number bond will be fully redeemable
    event BondCreated(uint256 deposit, uint256 payout, uint256 expires);

    /// @notice Emitted when a bond is redeemed
    /// @param recipient Address receiving PDT
    /// @param payout Amount of PDT redeemed
    /// @param remaining Amount of PDT left to be paid out
    event BondRedeemed(address recipient, uint256 payout, uint256 remaining);

    /// STATE VARIABLES ///

    /// @notice Paragon DAO Token
    IERC20 public immutable PDT;
    /// @notice Parallel ERC1155
    IERC1155 public immutable LL;
    /// @notice Custom Treasury
    IParagonBondingTreasury public immutable customTreasury;
    /// @notice Olympus DAO address
    address public immutable olympusDAO;
    /// @notice Olympus treasury address
    address public olympusTreasury;

    /// @notice Total Parallel tokens that have been bonded
    uint256 public totalPrincipalBonded;
    /// @notice Total PDT tokens given as payout
    uint256 public totalPayoutGiven;
    /// @notice Vesting term in blocks
    uint256 public vestingTerm;
    /// @notice Number of blocks to double bond price
    uint256 public blocksToDouble;
    /// @notice Percent fee that goes to Olympus
    uint256 public immutable olympusFee = 33300;

    /// @notice Array of IDs that have been bondable
    uint256[] public bondedIds;

    /// @notice Bool if bond contract is active
    bool public active;

    /// @notice Stores bond information for depositors
    mapping(address => Bond) public bondInfo;

    /// @notice Stores bond information for a Parallel ID
    mapping(uint256 => IdDetails) public idDetails;

    /// STRUCTS ///

    /// @notice           Details of an addresses current bond
    /// @param payout     PDT tokens remaining to be paid
    /// @param vesting    Blocks left to vest
    /// @param lastBlock  Last interaction
    struct Bond {
        uint256 payout;
        uint256 vesting;
        uint256 lastBlock;
    }

    /// @notice                     Details of an ID that is to be bonded
    /// @param startingBondPrice    Payout price of the ID
    /// @param maxBondPrice         Max payout price for ID
    /// @param startingBlock        Block ID detail was set on
    /// @param remainingToBeBonded  Remaining amount of tokens that can be bonded
    /// @param inArray              Bool if ID is in array that keeps track of IDs
    struct IdDetails {
        uint256 startingBondPrice;
        uint256 maxBondPrice;
        uint256 startingBlock;
        uint256 remainingToBeBonded;
        bool inArray;
    }

    /// CONSTRUCTOR ///

    /// @param _customTreasury   Address of cusotm treasury
    /// @param _LL               Address of the Parallel token
    /// @param _olympusTreasury  Address of the Olympus treasury
    /// @param _initialOwner     Address of the initial owner
    /// @param _olympusDAO       Address of Olympus DAO
    constructor(
        address _customTreasury,
        address _LL,
        address _olympusTreasury,
        address _initialOwner,
        address _olympusDAO
    ) {
        require(_customTreasury != address(0));
        customTreasury = IParagonBondingTreasury(_customTreasury);
        PDT = IERC20(IParagonBondingTreasury(_customTreasury).PDT());
        require(_LL != address(0));
        LL = IERC1155(_LL);
        require(_olympusTreasury != address(0));
        olympusTreasury = _olympusTreasury;
        require(_initialOwner != address(0));
        policy = _initialOwner;
        require(_olympusDAO != address(0));
        olympusDAO = _olympusDAO;
    }

    /// POLICY FUNCTIONS ///

    /// @notice                 Activates bond and sets vesting rate
    /// @param _vestingTerm     Vesting term in blocks
    /// @param _blocksToDouble  Amount of blocks for starting bond price to double
    function activateBond(uint256 _vestingTerm, uint256 _blocksToDouble)
        external
        onlyPolicy
    {
        require(!active, "Already active");
        vestingTerm = _vestingTerm;
        blocksToDouble = _blocksToDouble;
        active = true;
    }

    /// @notice  Decativates bond
    function deactivateBond() external onlyPolicy {
        require(active, "Already inactive");
        active = false;
    }

    /// @notice          Updates current vesting term
    /// @param _vesting  New vesting in blocks
    function setVesting(uint256 _vesting) external onlyPolicy {
        require(active, "Not active");
        vestingTerm = _vesting;
    }

    /// @notice                 Updates blocks to double
    /// @param _blocksToDouble  New amount of blocks to double starting bond price
    function setBlocksToDouble(uint256 _blocksToDouble) external onlyPolicy {
        require(active, "Not active");
        blocksToDouble = _blocksToDouble;
    }

    /// @notice                      Set bond price and how many to be bonded for each ID
    /// @param _ids                  Array of IDs that will be bonded
    /// @param _startingPrices       PDT given to bond correspond ID in `_ids`
    /// @param _toBeBonded           Number of IDs looking to be acquired
    /// @param _maxBondPercentAbove  Percent max price will be above an _`ids` starting price --- i.e. 20 = 20% over starting price
    function setIdDetails(
        uint256[] calldata _ids,
        uint256[] calldata _startingPrices,
        uint256 _toBeBonded,
        uint256 _maxBondPercentAbove
    ) external onlyPolicy {
        require(_ids.length == _startingPrices.length, "Lengths do not match");
        for (uint256 i; i < _ids.length; i++) {
            IdDetails memory idDetail = idDetails[_ids[i]];
            idDetail.startingBondPrice = _startingPrices[i];
            idDetail.maxBondPrice = _startingPrices[i].add(
                _startingPrices[i].mul(_maxBondPercentAbove).div(100)
            );
            idDetail.startingBlock = block.number;
            idDetail.remainingToBeBonded = _toBeBonded;
            if (!idDetail.inArray) {
                bondedIds.push(_ids[i]);
                idDetail.inArray = true;
            }
            idDetails[_ids[i]] = idDetail;
        }
    }

    /// @notice                  Updates address to send Olympus fee to
    /// @param _olympusTreasury  Address of new Olympus treasury
    function changeOlympusTreasury(address _olympusTreasury) external {
        require(msg.sender == olympusDAO, "Only Olympus DAO");
        olympusTreasury = _olympusTreasury;
    }

    /// USER FUNCTIONS ///

    /// @notice            Bond Parallel ERC1155 to get PDT tokens
    /// @param _id         ID number that is being bonded
    /// @param _amount     Amount of sepcific `_id` to bond
    /// @param _depositor  Address that PDT tokens will be redeemable for
    function deposit(
        uint256 _id,
        uint256 _amount,
        address _depositor
    ) external returns (uint256) {
        require(active, "Not active");
        require(
            idDetails[_id].startingBondPrice > 0 &&
                idDetails[_id].remainingToBeBonded >= _amount,
            "Not bondable"
        );
        require(_amount > 0, "Cannot bond 0");
        require(_depositor != address(0), "Invalid address");

        uint256 payout;
        uint256 fee;

        // payout and fee is computed
        (payout, fee) = payoutFor(_id);

        payout = payout.mul(_amount);
        fee = fee.mul(_amount);

        // depositor info is stored
        bondInfo[_depositor] = Bond({
            payout: bondInfo[_depositor].payout.add(payout),
            vesting: vestingTerm,
            lastBlock: block.number
        });

        idDetails[_id].remainingToBeBonded = idDetails[_id]
            .remainingToBeBonded
            .sub(_amount);

        totalPrincipalBonded = totalPrincipalBonded.add(_amount);
        totalPayoutGiven = totalPayoutGiven.add(payout);

        customTreasury.sendPDT(payout.add(fee));

        PDT.safeTransfer(olympusTreasury, fee);

        // transfer principal bonded to custom treasury
        LL.safeTransferFrom(
            msg.sender,
            address(customTreasury),
            _id,
            _amount,
            ""
        );

        // indexed events are emitted
        emit BondCreated(_id, payout, block.number.add(vestingTerm));

        return payout;
    }

    /// @notice            Redeem bond for `depositor`
    /// @param _depositor  Address of depositor being redeemed
    /// @return            Amount of PDT redeemed
    function redeem(address _depositor) external returns (uint256) {
        Bond memory info = bondInfo[_depositor];

        // (blocks since last interaction / vesting term remaining)
        uint256 percentVested = percentVestedFor(_depositor);

        // if fully vested
        if (percentVested >= 10000) {
            delete bondInfo[_depositor];
            emit BondRedeemed(_depositor, info.payout, 0);
            PDT.safeTransfer(_depositor, info.payout);
            return info.payout;
        } else {
            // calculate payout vested
            uint256 payout = info.payout.mul(percentVested).div(10000);

            // store updated deposit info
            bondInfo[_depositor] = Bond({
                payout: info.payout.sub(payout),
                vesting: info.vesting.sub(block.number.sub(info.lastBlock)),
                lastBlock: block.number
            });

            emit BondRedeemed(_depositor, payout, bondInfo[_depositor].payout);
            PDT.safeTransfer(_depositor, payout);
            return payout;
        }
    }

    /// VIEW FUNCTIONS ///

    /// @notice          Payout and fee for a specific bond ID
    /// @param _id       ID to get payout and fee for
    /// @return payout_  Amount of PDT user will recieve for bonding `_id`
    /// @return fee_     Amount of PDT Olympus will recieve for the bonding of `_id`
    function payoutFor(uint256 _id)
        public
        view
        returns (uint256 payout_, uint256 fee_)
    {
        uint256 price = currentPrice(_id);
        fee_ = price.mul(olympusFee).div(1e6);
        payout_ = price.sub(fee_);
    }

    /// @notice         Gets the current price of a token
    /// @param _id      ID to get price for
    /// @return price_  Price of token `_id`
    function currentPrice(uint256 _id) public view returns (uint256 price_) {
        IdDetails memory idDetail = idDetails[_id];
        uint256 blocksPassed = block.number.sub(idDetail.startingBlock);
        price_ = idDetail.startingBondPrice.add(
            idDetail.startingBondPrice.mul(blocksPassed).div(blocksToDouble)
        );
        if (price_ > idDetail.maxBondPrice) price_ = idDetail.maxBondPrice;
    }

    /// @notice                 Calculate how far into vesting `_depositor` is
    /// @param _depositor       Address of depositor
    /// @return percentVested_  Percent `_depositor` is into vesting
    function percentVestedFor(address _depositor)
        public
        view
        returns (uint256 percentVested_)
    {
        Bond memory bond = bondInfo[_depositor];
        uint256 blocksSinceLast = block.number.sub(bond.lastBlock);
        uint256 vesting = bond.vesting;

        if (vesting > 0) {
            percentVested_ = blocksSinceLast.mul(10000).div(vesting);
        } else {
            percentVested_ = 0;
        }
    }

    /// @notice                 Calculate amount of payout token available for claim by `_depositor`
    /// @param _depositor       Address of depositor
    /// @return pendingPayout_  Pending payout for `_depositor`
    function pendingPayoutFor(address _depositor)
        external
        view
        returns (uint256 pendingPayout_)
    {
        uint256 percentVested = percentVestedFor(_depositor);
        uint256 payout = bondInfo[_depositor].payout;

        if (percentVested >= 10000) {
            pendingPayout_ = payout;
        } else {
            pendingPayout_ = payout.mul(percentVested).div(10000);
        }
    }

    /// @notice  Returns all the ids that are bondable and the amounts that can be bonded for each
    /// @return  Array of all IDs that are bondable
    /// @return  Array of amount remaining to be bonded for each bondable ID
    function bondableIds()
        external
        view
        returns (uint256[] memory, uint256[] memory)
    {
        uint256 numberOfBondable;

        for (uint256 i = 0; i < bondedIds.length; i++) {
            uint256 id = bondedIds[i];
            (bool active_, ) = canBeBonded(id);
            if (active_) numberOfBondable++;
        }

        uint256[] memory ids = new uint256[](numberOfBondable);
        uint256[] memory leftToBond = new uint256[](numberOfBondable);

        uint256 nonce;
        for (uint256 i = 0; i < bondedIds.length; i++) {
            uint256 id = bondedIds[i];
            (bool active_, uint256 amount) = canBeBonded(id);
            if (active_) {
                ids[nonce] = id;
                leftToBond[nonce] = amount;
                nonce++;
            }
        }

        return (ids, leftToBond);
    }

    /// @notice     Determines if `_id` can be bonded, and if so how much is left
    /// @param _id  ID to check if can be bonded
    /// @return     Bool if `_id` can be bonded
    /// @return     Amount of tokens that be bonded for `_id`
    function canBeBonded(uint256 _id) public view returns (bool, uint256) {
        IdDetails memory idDetail = idDetails[_id];
        if (
            idDetail.startingBondPrice > 0 && idDetail.remainingToBeBonded > 0
        ) {
            return (true, idDetail.remainingToBeBonded);
        } else {
            return (false, 0);
        }
    }
}
