// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PMCGovernanceCompliant.sol";

/**
 * @notice Common Governance fo all games.
 * Currently implemented for two params: min bet, game duration
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
    mapping(address => uint256) tokensForVoter;
  }

  uint256 constant private TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;
  uint16 constant private VOTES_TO_ACCEPT_PROPOSAL = 500;

  address pmct;
  address[] games;  //  individual game Smart Contracts to be governed

  uint256[] public proposalsMinBetValues;
  uint256[] public proposalsGameDurationValues;

  mapping(address => uint256) public proposalMinBetValueParticipated;
  mapping(address => uint256) public proposalGameDurationValueParticipated;

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

  event ProposalAdded(address sender, ProposalType proposalType);
  event ProposalVoted(address sender, ProposalType proposalType);
  event ProposalQuitted(address sender, ProposalType proposalType);

  constructor(address _pmct, address[] memory _games) {
    require(_pmct != address(0), "Wrong _pmct");
    pmct = _pmct;

    for (uint8 i = 0; i < _games.length; i++) {
      require(_games[i] != address(0), "Wrong _erc20Game");
      games.push(_games[i]);
    }
  }

  function addProposal(ProposalType _proposalType, uint256 _value, uint256 _tokens) external onlyValidProposal(_proposalType) {
    (_proposalType == ProposalType.minBet) ? _addProposalMinBet(_value, _tokens) : _addProposalGameDuration(_value, _tokens);
  }

  //  <-- ADD, VOTE MIN BET
  function _addProposalMinBet(uint256 _minBet, uint256 _tokens) private {
    require(proposalMinBetValueParticipated[msg.sender] == 0 || proposalMinBetValueParticipated[msg.sender] == _minBet, "Already voted");
    
    (proposalsMinBet[_minBet].votesTotal == 0) ? _createProposalMinBet(_minBet, _tokens) : _voteProposalMinBet(_minBet, _tokens);
  }

  function _createProposalMinBet(uint256 _minBet, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_minBet > 0, "Wrong minBet");

    proposalsMinBetValues.push(_minBet);
    proposalMinBetValueParticipated[msg.sender] = _minBet;

    proposalsMinBet[_minBet].votesTotal = 1;
    proposalsMinBet[_minBet].tokensTotal = _tokens;
    proposalsMinBet[_minBet].tokensForVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.minBet);
  }

   function _voteProposalMinBet(uint256 _minBet, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(_minBet > 0, "Wrong minBet");
   
    proposalsMinBet[_minBet].votesTotal = proposalsMinBet[_minBet].votesTotal.add(1);
    proposalsMinBet[_minBet].tokensTotal = proposalsMinBet[_minBet].tokensTotal.add(_tokens);
    proposalsMinBet[_minBet].tokensForVoter[msg.sender] = proposalsMinBet[_minBet].tokensForVoter[msg.sender].add(_tokens);

    _checkAndAcceptProposaMinBet(_minBet);

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalVoted(msg.sender, ProposalType.minBet);
   }

   function _checkAndAcceptProposaMinBet(uint256 _minBet) private {
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
  //  ADD, VOTE MIN BET -->


  //  <-- ADD, VOTE GAME DURATION

  function _addProposalGameDuration(uint256 _blocks, uint256 _tokens) private {
    require(proposalGameDurationValueParticipated[msg.sender] == 0 || proposalGameDurationValueParticipated[msg.sender] == _blocks, "Already voted");
    
    (proposalsGameDuration[_blocks].votesTotal == 0) ? _createProposalGameDuration(_blocks, _tokens) : _voteProposalGameDuration(_blocks, _tokens);
  }

  function _createProposalGameDuration(uint256 _blocks, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");

    proposalsGameDurationValues.push(_blocks);
    proposalGameDurationValueParticipated[msg.sender] = _blocks;

    proposalsGameDuration[_blocks].votesTotal = 1;
    proposalsGameDuration[_blocks].tokensTotal = _tokens;
    proposalsGameDuration[_blocks].tokensForVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.gameDuration);
  }

   function _voteProposalGameDuration(uint256 _blocks, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");
   
    proposalsGameDuration[_blocks].votesTotal = proposalsGameDuration[_blocks].votesTotal.add(1);
    proposalsGameDuration[_blocks].tokensTotal = proposalsGameDuration[_blocks].tokensTotal.add(_tokens);
    proposalsGameDuration[_blocks].tokensForVoter[msg.sender] = proposalsGameDuration[_blocks].tokensForVoter[msg.sender].add(_tokens);

    _checkAndAcceptProposalGameDuration(_blocks);

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
    emit ProposalVoted(msg.sender, ProposalType.gameDuration);
   }

   function _checkAndAcceptProposalGameDuration(uint256 _blocks) private {
    if (proposalsGameDuration[_blocks].votesTotal < VOTES_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsGameDuration[_blocks].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameDuration(uint16(_blocks));
    }
   }

  //  ADD, VOTE GAME DURATION -->

  //  <-- QUIT PROPOSAL
  function quitProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {
    _proposalType == ProposalType.minBet ? _quitProposalMinBet() : _quitProposalGameDuration();

    //  TODO: remove tokens from global
  }

  function _quitProposalMinBet() private {
    uint256 votedValue = proposalMinBetValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    uint256 tokensVoted = proposalsMinBet[votedValue].tokensForVoter[msg.sender];
    proposalsMinBet[votedValue].votesTotal = proposalsMinBet[votedValue].votesTotal.sub(1);
    proposalsMinBet[votedValue].tokensTotal = proposalsMinBet[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinBet[votedValue].tokensForVoter[msg.sender];
    delete proposalMinBetValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.minBet);
  }

  function _quitProposalGameDuration() private {
    uint256 votedValue = proposalGameDurationValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    uint256 tokensVoted = proposalsGameDuration[votedValue].tokensForVoter[msg.sender];
    proposalsGameDuration[votedValue].votesTotal = proposalsGameDuration[votedValue].votesTotal.sub(1);
    proposalsGameDuration[votedValue].tokensTotal = proposalsGameDuration[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsGameDuration[votedValue].tokensForVoter[msg.sender];
    delete proposalGameDurationValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.gameDuration);
  }
  //  QUIT PROPOSAL -->

  function getProposalsCount(ProposalType _proposalType) external view onlyValidProposal(_proposalType) returns(uint256) {
    return (_proposalType == ProposalType.minBet) ? proposalsMinBetValues.length : proposalsGameDurationValues.length;
  }

  function getProposalInfo(ProposalType _proposalType, uint256 _value) external view onlyValidProposal(_proposalType) returns (uint256 votesTotal, uint256 tokensTotal, uint256 tokensForVoter) {
    if (_proposalType == ProposalType.minBet) {
      require(proposalsMinBet[_value].votesTotal > 0, "No value");
      
      votesTotal = proposalsMinBet[_value].votesTotal;
      tokensTotal = proposalsMinBet[_value].tokensTotal;
      tokensForVoter = proposalsMinBet[_value].tokensForVoter[msg.sender];
    } else {
      require(proposalsGameDuration[_value].votesTotal > 0, "No value");
      
      votesTotal = proposalsGameDuration[_value].votesTotal;
      tokensTotal = proposalsGameDuration[_value].tokensTotal;
      tokensForVoter = proposalsGameDuration[_value].tokensForVoter[msg.sender];
    }
  }
}
