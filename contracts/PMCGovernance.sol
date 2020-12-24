// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PMCGovernanceCompliant.sol";

/**
 * @notice Min bet, game duration.
 * @dev Common Governance fo all games.
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
    mapping(address => uint256) tokensOfVoter;
  }

  uint256 constant private MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;
  uint16 constant private MIN_VOTES_TO_ACCEPT_PROPOSAL = 500;

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


  /**
   * @dev Constructs Smart Contract.
   * @param _pmct PMCt address.
   * @param _games Game addresses, that shuld be governed by this Smart Contract. Should be PMCGovernanceCompliant.
   */
  constructor(address _pmct, address[] memory _games) {
    require(_pmct != address(0), "Wrong _pmct");
    pmct = _pmct;

    for (uint8 i = 0; i < _games.length; i++) {
      require(_games[i] != address(0), "Wrong _erc20Game");
      games.push(_games[i]);
    }
  }

  /**
   * @dev Adds proposal.
   * @param _proposalType Proposal type.
   * @param _value Proposal value.
   * @param _tokens PMCt amount to vote.
   */
  function addProposal(ProposalType _proposalType, uint256 _value, uint256 _tokens) external onlyValidProposal(_proposalType) {
    (_proposalType == ProposalType.minBet) ? _addProposalMinBet(_value, _tokens) : _addProposalGameDuration(_value, _tokens);
  }

  //  <-- ADD, VOTE MIN BET
  /**
   * @dev Adds proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalMinBet(uint256 _minBet, uint256 _tokens) private {
    require(proposalMinBetValueParticipated[msg.sender] == 0 || proposalMinBetValueParticipated[msg.sender] == _minBet, "Already voted");
    
    (proposalsMinBet[_minBet].votesTotal == 0) ? _createProposalMinBet(_minBet, _tokens) : _voteProposalMinBet(_minBet, _tokens);
  }

  /**
   * @dev Creates proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalMinBet(uint256 _minBet, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_minBet > 0, "Wrong minBet");

    proposalsMinBetValues.push(_minBet);
    proposalMinBetValueParticipated[msg.sender] = _minBet;

    proposalsMinBet[_minBet].votesTotal = 1;
    proposalsMinBet[_minBet].tokensTotal = _tokens;
    proposalsMinBet[_minBet].tokensOfVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.minBet);
  }

  /**
   * @dev Votes proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _voteProposalMinBet(uint256 _minBet, uint256 _tokens) public onlyAllowedTokens(_tokens) {
  require(_minBet > 0, "Wrong minBet");
  
  proposalsMinBet[_minBet].votesTotal = proposalsMinBet[_minBet].votesTotal.add(1);
  proposalsMinBet[_minBet].tokensTotal = proposalsMinBet[_minBet].tokensTotal.add(_tokens);
  proposalsMinBet[_minBet].tokensOfVoter[msg.sender] = proposalsMinBet[_minBet].tokensOfVoter[msg.sender].add(_tokens);

  _checkAndAcceptProposaMinBet(_minBet);

  ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

  emit ProposalVoted(msg.sender, ProposalType.minBet);
  }

  /**
   * @dev Checks if proposal minBet should be accepted and accepts if needed.
   * @param _minBet minBet value.
   */
  function _checkAndAcceptProposaMinBet(uint256 _minBet) private {
    if (proposalsMinBet[_minBet].votesTotal < MIN_VOTES_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsMinBet[_minBet].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMinBet(_minBet);
    }
  }
  //  ADD, VOTE MIN BET -->


  //  <-- ADD, VOTE GAME DURATION
  /**
   * @dev Adds proposal gameDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalGameDuration(uint256 _blocks, uint256 _tokens) private {
    require(proposalGameDurationValueParticipated[msg.sender] == 0 || proposalGameDurationValueParticipated[msg.sender] == _blocks, "Already voted");
    
    (proposalsGameDuration[_blocks].votesTotal == 0) ? _createProposalGameDuration(_blocks, _tokens) : _voteProposalGameDuration(_blocks, _tokens);
  }

  /**
   * @dev Creates proposal gameDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalGameDuration(uint256 _blocks, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");

    proposalsGameDurationValues.push(_blocks);
    proposalGameDurationValueParticipated[msg.sender] = _blocks;

    proposalsGameDuration[_blocks].votesTotal = 1;
    proposalsGameDuration[_blocks].tokensTotal = _tokens;
    proposalsGameDuration[_blocks].tokensOfVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.gameDuration);
  }

  /**
   * @dev Votes proposal gameDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _voteProposalGameDuration(uint256 _blocks, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");
    
    proposalsGameDuration[_blocks].votesTotal = proposalsGameDuration[_blocks].votesTotal.add(1);
    proposalsGameDuration[_blocks].tokensTotal = proposalsGameDuration[_blocks].tokensTotal.add(_tokens);
    proposalsGameDuration[_blocks].tokensOfVoter[msg.sender] = proposalsGameDuration[_blocks].tokensOfVoter[msg.sender].add(_tokens);

    _checkAndAcceptProposalGameDuration(_blocks);

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
    emit ProposalVoted(msg.sender, ProposalType.gameDuration);
  }

  /**
   * @dev Checks if proposal gameDuration should be accepted and accepts if needed..
   * @param _blocks blocks duration value.
   */
  function _checkAndAcceptProposalGameDuration(uint256 _blocks) private {
    if (proposalsGameDuration[_blocks].votesTotal < MIN_VOTES_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsGameDuration[_blocks].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameDuration(uint16(_blocks));
    }
  }

  //  ADD, VOTE GAME DURATION -->


  //  <-- QUIT PROPOSAL
  /**
   * @dev Quits proposal.
   * @param _proposalType Proposal type.
   */
  function quitProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {
    _proposalType == ProposalType.minBet ? _quitProposalMinBet() : _quitProposalGameDuration();
  }

  /**
   * @dev Quits proposal minBet.
   */
  function _quitProposalMinBet() private {
    uint256 votedValue = proposalMinBetValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    proposalsMinBet[votedValue].votesTotal = proposalsMinBet[votedValue].votesTotal.sub(1);
    uint256 tokensVoted = proposalsMinBet[votedValue].tokensOfVoter[msg.sender];
    proposalsMinBet[votedValue].tokensTotal = proposalsMinBet[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinBet[votedValue].tokensOfVoter[msg.sender];
    delete proposalMinBetValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.minBet);
  }

  /**
   * @dev Quits proposal gameDuration.
   */
  function _quitProposalGameDuration() private {
    uint256 votedValue = proposalGameDurationValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    proposalsGameDuration[votedValue].votesTotal = proposalsGameDuration[votedValue].votesTotal.sub(1);
    uint256 tokensVoted = proposalsGameDuration[votedValue].tokensOfVoter[msg.sender];
    proposalsGameDuration[votedValue].tokensTotal = proposalsGameDuration[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsGameDuration[votedValue].tokensOfVoter[msg.sender];
    delete proposalGameDurationValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.gameDuration);
  }


  //  QUIT PROPOSAL -->
  /**
   * @dev Gets proposals count.
   * @param _proposalType Proposal type.
   * @return Count of proposals.
   */
  function getProposalsCount(ProposalType _proposalType) external view onlyValidProposal(_proposalType) returns(uint256) {
    return (_proposalType == ProposalType.minBet) ? proposalsMinBetValues.length : proposalsGameDurationValues.length;
  }

  /**
   * @dev Gets proposal info.
   * @param _proposalType Proposal type.
   * @param _value Proposal value.
   * @return votesTotal Votes total for proposal.
   * @return tokensTotal PMCt total for proposal.
   * @return tokensOfVoter PMCt of sender for proposal.
   */
  function getProposalInfo(ProposalType _proposalType, uint256 _value) external view onlyValidProposal(_proposalType) returns (uint256 votesTotal, uint256 tokensTotal, uint256 tokensOfVoter) {
    if (_proposalType == ProposalType.minBet) {
      require(proposalsMinBet[_value].votesTotal > 0, "No value");
      
      votesTotal = proposalsMinBet[_value].votesTotal;
      tokensTotal = proposalsMinBet[_value].tokensTotal;
      tokensOfVoter = proposalsMinBet[_value].tokensOfVoter[msg.sender];
    } else {
      require(proposalsGameDuration[_value].votesTotal > 0, "No value");
      
      votesTotal = proposalsGameDuration[_value].votesTotal;
      tokensTotal = proposalsGameDuration[_value].tokensTotal;
      tokensOfVoter = proposalsGameDuration[_value].tokensOfVoter[msg.sender];
    }
  }
}