// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PMCGovernanceCompliant.sol";

/**
 * @notice Common Governance fo all games.
 */
contract PMCGovernance is Ownable {
  using SafeMath for uint256;

  enum ProposalType {
    minBet,
    gameDuration
  }

  struct Proposal {
    uint256 votesTotal;
    uint256 tokensTotal;
    mapping(address => uint256) tokens;
  }

  uint256 constant private TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;
  uint16 constant private VOTES_TO_ACCEPT_PROPOSAL = 500;

  address pmct;
  address[] games;  //  game Smart Contracts to be governed

  uint256[] public proposalsMinBetValues;
  uint256[] public proposalsGameDurationValues;

  mapping(uint256 => Proposal) public proposalsMinBet;
  mapping(uint256 => Proposal) public proposalsGameDuration;


  modifier onlyValidProposal(ProposalType _proposalType) {
    require(_proposalType <= ProposalType.gameDuration, "Wrong type");
    _;
  }

  modifier onlyAllowedTokens(uint256 _tokens) {
    require(_tokens > 0, "0 tokens");
    require(ERC20(pmct).allowance(msg.sender, address(this)) >= _tokens, "Tokens not allowed");
    _;
  }

  constructor(address _pmct, address[] memory _games) {
    require(_pmct != address(0), "Wrong _pmct");
    pmct = _pmct;

    for (uint8 i = 0; i < _games.length; i++) {
      require(_games[i] != address(0), "Wrong _erc20Game");
      //  TODO: validate interface
      games.push(_games[i]);
    }
  }

  //  ADD PROPOSAL
  function addProposal(ProposalType _proposalType, uint256 _value, uint256 _tokens) external onlyValidProposal(_proposalType) {
    if (_proposalType == ProposalType.minBet) {
      _addProposalMinBet(_value, _tokens);
    } else {
      // require(_address == address(0), "Address must be 0");
      // _addProposalGameDuration(_value, _tokens);
    }
  }

  function _addProposalMinBet(uint256 _minBet, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    (proposalsMinBet[_minBet].votesTotal == 0) ? _createProposalMinBet(_minBet, _tokens) : _voteProposalMinBet(_minBet, _tokens);
  }

  function _createProposalMinBet(uint256 _minBet, uint256 _tokens) private {
    require(_minBet > 0, "Wrong value");

    proposalsMinBet[_minBet].votesTotal = 1;
    proposalsMinBet[_minBet].tokensTotal = _tokens;
    proposalsMinBet[_minBet].tokens[msg.sender] = _tokens;

    proposalsMinBetValues.push(_minBet);
  }

   function _voteProposalMinBet(uint256 _minBet, uint256 _tokens) private {
    require(_minBet > 0, "Wrong minBet");
   
    proposalsMinBet[_minBet].votesTotal = proposalsMinBet[_minBet].votesTotal.add(1);
    proposalsMinBet[_minBet].tokensTotal = proposalsMinBet[_minBet].tokensTotal.add(_tokens);
    proposalsMinBet[_minBet].tokens[msg.sender] = proposalsMinBet[_minBet].tokens[msg.sender].add(_tokens);

    _acceptProposaMinBetlIfNeeded(_minBet);
   }

   function _acceptProposaMinBetlIfNeeded(uint256 _minBet) private {
    if (proposalsMinBet[_minBet].votesTotal < VOTES_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsMinBet[_minBet].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMinBet(_minBet);
    }
   }
  
  // function _addProposalGameDuration(uint256 _blocks, uint256 _tokens) private onlyAllowedTokens(_tokens) {
  //   require(_blocks > 0, "Wrong blocks");
  //   require(!proposalsGameDurationUsedValues[_blocks], "Duplicate");

  //   proposalsGameDurationUsedValues[_blocks] = true;
  //   // proposalsGameDuration.push(ProposalGameDuration(_blocks, 1, _tokens));
  //   ProposalGameDuration storage proposal = ProposalGameDuration();

  //   ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
  // }


  //  VOTE PROPOSAL
  function voteProposal(ProposalType _proposalType, address _address, uint256 _value) external onlyValidProposal(_proposalType) {
    if (_proposalType == ProposalType.minBet) {
      // _addProposalMinBet(_address, _value);
    } else if (_proposalType == ProposalType.gameDuration) {
      require(_address == address(0), "Wrong address");
    //   _voteProposalGameDuration(_value);
    } else {
      require(_value == 0, "Wrong value");
      // _addProposalAddToken(_address);
    }
  }
  
  // function _voteProposalGameDuration(uint256 _blocks) private {
  //   require(_blocks > 0, "Wrong blocks");
  //   require(proposalsGameDurationUsedValues[_blocks], "No proposal");

  //   proposalsGameDurationUsedValues[_blocks] = true;
  // }

  // function _voteProposalAddToken(address _address) private {
  //   require(_address != address(0), "Wrong address");
  //   require(!proposalsAddTokenUsedValues[_address], "No proposal");

  //   proposalsAddTokenUsedValues[_address] = true;
  // }

  //  QUIT PROPOSAL
  function quitProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {

  }
  
  function acceptProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {

  }

  function getProposalsCountMinBet() external view returns(uint256) {
    // return proposalsMinBet.length;
  }
  
  function getProposalsCountGameDuration() external view returns(uint256) {
    // return proposalsGameDuration.length;
  }


  function getProposalInfo(ProposalType _proposalType, uint256 _idx) external view onlyValidProposal(_proposalType) returns (address addr, uint256 value, uint256 voters) {
    // if (_proposalType == ProposalType.minBet) {
      
    // } else if (_proposalType == ProposalType.gameDuration) {
      
    // } else (_proposalType == ProposalType.addToken) {
      
    // }
  }
}
