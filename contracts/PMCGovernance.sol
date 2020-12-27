// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PMCGovernanceCompliant.sol";

/**
 * @notice Min bet, game duration, add token.
 * @notice User can participate in single proposal of the type.
 * @dev Common Governance for all games, that bet ETH only.
 */
contract PMCGovernance is Ownable {
  using SafeMath for uint256;

  enum ProposalType {
    minBet,
    gameMaxDuration,
    addToken    //  TODO: implement
  }

  struct Proposal {
    uint256 votersTotal; //  individual voters
    uint256 tokensTotal;
    mapping(address => uint256) tokensOfVoter;
  }
  
  struct MinBetVote {
    address token;
    uint256 value;
  }

  uint256 constant private MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;   //  amount of tokens for the proposal to be accepted
  uint16 constant private MIN_VOTERS_TO_ACCEPT_PROPOSAL = 500;   //  amount of individual voters for the proposal to be accepted

  address pmct;
  address[] games;  //  individual game Smart Contracts to be governed

  mapping(address => uint256[]) public proposalsMinBetValueForToken;   //  token => values[]
  mapping(address => mapping(uint256 => Proposal)) public proposalsMinBetForToken;  //  token => (value => Proposal)
  mapping(address => MinBetVote) public proposalMinBetValueParticipated;   //  address => MinBetVote(token, value)
  
  uint256[] public proposalsGameMaxDurationValues;
  mapping(address => uint256) public proposalGameMaxDurationValueParticipated;
  mapping(uint256 => Proposal) public proposalsGameMaxDuration;

  modifier onlyValidProposal(ProposalType _proposalType) {
    require(_proposalType <= ProposalType.addToken, "Wrong type");
    _;
  }

  modifier onlyAllowedTokens(uint256 _tokens) {
    require(_tokens > 0, "0 tokens");
    require(ERC20(pmct).allowance(msg.sender, address(this)) >= _tokens, "Tokens not allowed");
    _;
  }

  event ProposalAdded(address sender, ProposalType proposalType, address token);
  event ProposalVoted(address sender, ProposalType proposalType, address token);
  event ProposalQuitted(address sender, ProposalType proposalType, address token);


  /**
   * @dev Constructs Smart Contract.
   * @param _pmct PMCt address.
   * @param _games Game addresses, that should be governed by this Smart Contract. Should be PMCGovernanceCompliant.
   */
  constructor(address _pmct, address[] memory _games) {
    require(_pmct != address(0), "Wrong _pmct");
    pmct = _pmct;

    for (uint8 i = 0; i < _games.length; i++) {
      require(_games[i] != address(0), "Wrong _game");
      games.push(_games[i]);
    }
  }

  /**
   * @dev Adds proposal.
   * @param _proposalType Proposal type.
   * @param _value Proposal value.
   * @param _tokens PMCt amount to vote.
   */
  function addProposal(address token, ProposalType _proposalType, uint256 _value, uint256 _tokens) external onlyValidProposal(_proposalType) {
      if (_proposalType == ProposalType.minBet) {
          _addProposalMinBet(token, _value, _tokens);
      } else if (_proposalType == ProposalType.gameMaxDuration) {
          _addProposalGameMaxDuration(token, _value, _tokens);
      } else {
          
      }
  }

  //  <-- ADD, VOTE MIN BET
  /**
   * @dev Adds proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalMinBet(address _token, uint256 _minBet, uint256 _tokens) private {
    require(proposalMinBetValueParticipated[msg.sender] == 0 || proposalMinBetValueParticipated[msg.sender] == _minBet, "Already voted");
    
    (proposalsMinBet[_minBet].votersTotal == 0) ? _createProposalMinBet(_minBet, _tokens) : _voteProposalMinBet(_minBet, _tokens);
  }

  /**
   * @dev Creates proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalMinBet(address _token, uint256 _minBet, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_minBet > 0, "Wrong minBet");
    require(proposalsMinBetForToken[_token][_minBet].votersTotal == 0, "Already exists");
    
    proposalsMinBetValues.push(_minBet);
    proposalMinBetValueParticipated[msg.sender] = _minBet;

    proposalsMinBet[_minBet].votersTotal = 1;
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
  
  proposalsMinBet[_minBet].votersTotal = proposalsMinBet[_minBet].votersTotal.add(1);
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
    if (proposalsMinBet[_minBet].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
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
   * @dev Adds proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalGameMaxDuration(uint256 _blocks, uint256 _tokens) private {
    require(proposalGameMaxDurationValueParticipated[msg.sender] == 0 || proposalGameMaxDurationValueParticipated[msg.sender] == _blocks, "Already voted");
    
    (proposalsGameMaxDuration[_blocks].votersTotal == 0) ? _createProposalGameMaxDuration(_blocks, _tokens) : _voteProposalGameMaxDuration(_blocks, _tokens);
  }

  /**
   * @dev Creates proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalGameMaxDuration(uint256 _blocks, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");
    require(proposalsGameMaxDuration[_blocks].votersTotal == 0, "Already exists");

    proposalsGameMaxDurationValues.push(_blocks);
    proposalGameMaxDurationValueParticipated[msg.sender] = _blocks;

    proposalsGameMaxDuration[_blocks].votersTotal = 1;
    proposalsGameMaxDuration[_blocks].tokensTotal = _tokens;
    proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.gameMaxDuration);
  }

  /**
   * @dev Votes proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function _voteProposalGameMaxDuration(uint256 _blocks, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(_blocks > 0, "Wrong duration");
    
    proposalsGameMaxDuration[_blocks].votersTotal = proposalsGameMaxDuration[_blocks].votersTotal.add(1);
    proposalsGameMaxDuration[_blocks].tokensTotal = proposalsGameMaxDuration[_blocks].tokensTotal.add(_tokens);
    proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender] = proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender].add(_tokens);

    _checkAndAcceptProposalGameMaxDuration(_blocks);

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
    emit ProposalVoted(msg.sender, ProposalType.gameMaxDuration);
  }

  /**
   * @dev Checks if proposal gameMaxDuration should be accepted and accepts if needed..
   * @param _blocks blocks duration value.
   */
  function _checkAndAcceptProposalGameMaxDuration(uint256 _blocks) private {
    if (proposalsGameMaxDuration[_blocks].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsGameMaxDuration[_blocks].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMaxDuration(uint16(_blocks));
    }
  }

  //  ADD, VOTE GAME DURATION -->


  //  <-- QUIT PROPOSAL
  /**
   * @dev Quits proposal.
   * @param _proposalType Proposal type.
   */
  function quitProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {
    _proposalType == ProposalType.minBet ? _quitProposalMinBet() : _quitProposalGameMaxDuration();
  }

  /**
   * @dev Quits proposal minBet.
   */
  function _quitProposalMinBet() private {
    uint256 votedValue = proposalMinBetValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    proposalsMinBet[votedValue].votersTotal = proposalsMinBet[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsMinBet[votedValue].tokensOfVoter[msg.sender];
    proposalsMinBet[votedValue].tokensTotal = proposalsMinBet[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinBet[votedValue].tokensOfVoter[msg.sender];
    delete proposalMinBetValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.minBet);
  }

  /**
   * @dev Quits proposal gameMaxDuration.
   */
  function _quitProposalGameMaxDuration() private {
    uint256 votedValue = proposalGameMaxDurationValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    proposalsGameMaxDuration[votedValue].votersTotal = proposalsGameMaxDuration[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsGameMaxDuration[votedValue].tokensOfVoter[msg.sender];
    proposalsGameMaxDuration[votedValue].tokensTotal = proposalsGameMaxDuration[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsGameMaxDuration[votedValue].tokensOfVoter[msg.sender];
    delete proposalGameMaxDurationValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.gameMaxDuration);
  }


  //  QUIT PROPOSAL -->
  /**
   * @dev Gets proposals count.
   * @param _proposalType Proposal type.
   * @return Count of proposals.
   */
  function getProposalsCount(ProposalType _proposalType) external view onlyValidProposal(_proposalType) returns(uint256) {
    return (_proposalType == ProposalType.minBet) ? proposalsMinBetValues.length : proposalsGameMaxDurationValues.length;
  }

  /**
   * @dev Gets proposal info.
   * @param _proposalType Proposal type.
   * @param _value Proposal value.
   * @return votersTotal Votes total for proposal.
   * @return tokensTotal PMCt total for proposal.
   * @return tokensOfVoter PMCt of sender for proposal.
   */
  function getProposalInfo(ProposalType _proposalType, uint256 _value) external view onlyValidProposal(_proposalType) returns (uint256 votersTotal, uint256 tokensTotal, uint256 tokensOfVoter) {
    if (_proposalType == ProposalType.minBet) {
      require(proposalsMinBet[_value].votersTotal > 0, "No value");
      
      votersTotal = proposalsMinBet[_value].votersTotal;
      tokensTotal = proposalsMinBet[_value].tokensTotal;
      tokensOfVoter = proposalsMinBet[_value].tokensOfVoter[msg.sender];
    } else {
      require(proposalsGameMaxDuration[_value].votersTotal > 0, "No value");
      
      votersTotal = proposalsGameMaxDuration[_value].votersTotal;
      tokensTotal = proposalsGameMaxDuration[_value].tokensTotal;
      tokensOfVoter = proposalsGameMaxDuration[_value].tokensOfVoter[msg.sender];
    }
  }
}