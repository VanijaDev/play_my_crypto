// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PMCGovernanceCompliant.sol";

/**
 * @notice Min stake, game duration, add token.
 * @notice User can participate in single proposal of the type.
 * @dev Common Governance for all games.
 */
contract PMCGovernance is Ownable {
  using SafeMath for uint256;

  enum ProposalType {
    minStake,
    gameMaxDuration,
    addToken
  }

  struct Proposal {
    uint256 votersTotal; //  individual voters
    uint256 tokensTotal;
    mapping(address => uint256) tokensOfVoter;
  }
  
  struct MinStakeVote {
    address token;
    uint256 value;
  }

  uint256 constant private MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;   //  amount of tokens for the proposal to be accepted
  uint16 constant private MIN_VOTERS_TO_ACCEPT_PROPOSAL = 2; // TODO: 500;   //  amount of voters for the proposal to be accepted

  address pmct;
  address[] games;  //  game Smart Contracts to be governed

    //  minStake
  uint256[] public proposalsMinStakeValues;
  mapping(address => uint256) public proposalMinStakeValueParticipated;
  mapping(uint256 => Proposal) public proposalsMinStake;
  
  //  gameMaxDuration
  uint256[] public proposalsGameMaxDurationValues;
  mapping(address => uint256) public proposalGameMaxDurationValueParticipated;
  mapping(uint256 => Proposal) public proposalsGameMaxDuration;

    //  addToken
  address[] public proposalsAddTokenValues;
  mapping(address => address) public proposalAddTokenValueParticipated;
  mapping(address => Proposal) public proposalsAddToken;
    

  modifier onlyValidProposal(ProposalType _proposalType) {
    require(_proposalType <= ProposalType.addToken, "Wrong type");
    _;
  }

  event ProposalAdded(address sender, ProposalType proposalType, address token);
  event ProposalVoted(address sender, ProposalType proposalType, address token);
  event ProposalQuitted(address sender, ProposalType proposalType);


  /**
   * @dev Constructor.
   * @param _pmct PMCt address.
   * @param _game Game addresses, that should be governed by this Smart Contract. Games should be PMCGovernanceCompliant.
   */
  constructor(address _pmct, address _game) {
    require(keccak256(abi.encodePacked(ERC20(_pmct).symbol())) == keccak256(abi.encodePacked("PMCt")), "Wrong _pmct");
    pmct = _pmct;

    require(_game != address(0), "Wrong _game");
    games.push(_game);
  }

  /**
   * @dev Adds game to be governed.
   * @param _game Game address, that should be governed by this Smart Contract. Should be PMCGovernanceCompliant.
   */
  function addGame(address _game) external onlyOwner {
    require(_game != address(0), "Wrong _game");
    games.push(_game);
  }

  /**
   * @dev Adds proposal.
   * @param _proposalType Proposal type.
   * @param _token Proposal token to be added.
   * @param _value Proposal value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function addProposal(ProposalType _proposalType, address _token, uint256 _value, uint256 _pmctTokens) external onlyValidProposal(_proposalType) {
    require(_pmctTokens > 0, "Wrong _pmctTokens");

    if (_proposalType == ProposalType.minStake) {
      require(_value > 0, "Wrong value");
      _addProposalMinStake(_value, _pmctTokens);
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      _addProposalGameMaxDuration(_value, _pmctTokens);
    } else {
      _addProposalAddToken(_token, _pmctTokens);
    }
  }

  //  <-- ADD, VOTE MIN STAKE
  /**
   * @dev Adds proposal minStake.
   * @param _minStake minStake value.
   * @param _pmctTokens PMCt amount to vote.
   * 
   */
  function _addProposalMinStake(uint256 _minStake, uint256 _pmctTokens) private {
    require(proposalMinStakeValueParticipated[msg.sender] == 0 || proposalMinStakeValueParticipated[msg.sender] == _minStake, "Already voted");

    (proposalsMinStake[_minStake].votersTotal == 0) ? _createProposalMinStake(_minStake, _pmctTokens) : voteProposalMinStake(_minStake, _pmctTokens);
  }

  /**
   * @dev Creates proposal minStake.
   * @param _minStake minStake value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _createProposalMinStake(uint256 _minStake, uint256 _pmctTokens) private {
    require(proposalsMinStake[_minStake].votersTotal == 0, "Already exists");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);
    
    proposalsMinStakeValues.push(_minStake);
    proposalMinStakeValueParticipated[msg.sender] = _minStake;

    proposalsMinStake[_minStake].votersTotal = 1;
    proposalsMinStake[_minStake].tokensTotal = _pmctTokens;
    proposalsMinStake[_minStake].tokensOfVoter[msg.sender] = _pmctTokens;

    emit ProposalAdded(msg.sender, ProposalType.minStake, address(0));
  }

  /**
   * @dev Votes proposal minStake.
   * @param _minStake minStake value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function voteProposalMinStake(uint256 _minStake, uint256 _pmctTokens) public {
    require(proposalsMinStake[_minStake].votersTotal > 0, "No proposal");
    require(_minStake > 0, "Wrong minStake");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);
  
    proposalsMinStake[_minStake].votersTotal = proposalsMinStake[_minStake].votersTotal.add(1);
    proposalsMinStake[_minStake].tokensTotal = proposalsMinStake[_minStake].tokensTotal.add(_pmctTokens);
    proposalsMinStake[_minStake].tokensOfVoter[msg.sender] = proposalsMinStake[_minStake].tokensOfVoter[msg.sender].add(_pmctTokens);
  
    emit ProposalVoted(msg.sender, ProposalType.minStake, address(0));
    
    _checkAndAcceptProposaMinStake(_minStake);
  }

  /**
   * @dev Checks if proposal minStake should be accepted and accepts if needed.
   * @param _minStake minStake value.
   */
  function _checkAndAcceptProposaMinStake(uint256 _minStake) private {
    if (proposalsMinStake[_minStake].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsMinStake[_minStake].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMinStakeETH(_minStake);
    }
  }
  //  ADD, VOTE MIN STAKE -->


  //  <-- ADD, VOTE GAME DURATION
  /**
   * @dev Adds proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _addProposalGameMaxDuration(uint256 _blocks, uint256 _pmctTokens) private {
    require(proposalGameMaxDurationValueParticipated[msg.sender] == 0 || proposalGameMaxDurationValueParticipated[msg.sender] == _blocks, "Already voted");

    (proposalsGameMaxDuration[_blocks].votersTotal == 0) ? _createProposalGameMaxDuration(_blocks, _pmctTokens) : voteProposalGameMaxDuration(_blocks, _pmctTokens);
  }

  /**
   * @dev Creates proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _createProposalGameMaxDuration(uint256 _blocks, uint256 _pmctTokens) private {
    require(_blocks > 0, "Wrong duration");
    require(proposalsGameMaxDuration[_blocks].votersTotal == 0, "Already exists");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);

    proposalsGameMaxDurationValues.push(_blocks);
    proposalGameMaxDurationValueParticipated[msg.sender] = _blocks;

    proposalsGameMaxDuration[_blocks].votersTotal = 1;
    proposalsGameMaxDuration[_blocks].tokensTotal = _pmctTokens;
    proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender] = _pmctTokens;

    emit ProposalAdded(msg.sender, ProposalType.gameMaxDuration, address(0));
  }

  /**
   * @dev Votes proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function voteProposalGameMaxDuration(uint256 _blocks, uint256 _pmctTokens) public {
    require(proposalsGameMaxDuration[_blocks].votersTotal > 0, "No proposal");
    require(_blocks > 0, "Wrong duration");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);
    
    proposalsGameMaxDuration[_blocks].votersTotal = proposalsGameMaxDuration[_blocks].votersTotal.add(1);
    proposalsGameMaxDuration[_blocks].tokensTotal = proposalsGameMaxDuration[_blocks].tokensTotal.add(_pmctTokens);
    proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender] = proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender].add(_pmctTokens);
    
    emit ProposalVoted(msg.sender, ProposalType.gameMaxDuration, address(0));

    _checkAndAcceptProposalGameMaxDuration(_blocks);
  }

  /**
   * @dev Checks if proposal gameMaxDuration should be accepted and accepts if needed..
   * @param _blocks blocks duration value.
   */
  function _checkAndAcceptProposalGameMaxDuration(uint256 _blocks) private {
    if (proposalsGameMaxDuration[_blocks].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsGameMaxDuration[_blocks].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMaxDuration(uint16(_blocks));
    }
  }

  //  ADD, VOTE GAME DURATION -->
  
  
  //  <-- ADD, VOTE ADD TOKEN
  /**
   * @dev Adds proposal addToken.
   * @param _token Token address to be added.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _addProposalAddToken(address _token, uint256 _pmctTokens) private {
    require(proposalAddTokenValueParticipated[msg.sender] == address(0) || proposalAddTokenValueParticipated[msg.sender] == _token, "Already voted");

    (proposalsAddToken[_token].votersTotal == 0) ? _createProposalAddToken(_token, _pmctTokens) : voteProposalAddToken(_token, _pmctTokens);
  }

  /**
   * @dev Creates proposal addToken.
   * @param _token Token address to be added.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _createProposalAddToken(address _token, uint256 _pmctTokens) private {
    require(_token != address(0), "Wrong token");
    require(proposalsAddToken[_token].votersTotal == 0, "Already exists");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);

    proposalsAddTokenValues.push(_token);
    proposalAddTokenValueParticipated[msg.sender] = _token;

    proposalsAddToken[_token].votersTotal = 1;
    proposalsAddToken[_token].tokensTotal = _pmctTokens;
    proposalsAddToken[_token].tokensOfVoter[msg.sender] = _pmctTokens;

    emit ProposalAdded(msg.sender, ProposalType.addToken, _token);
  }

  /**
   * @dev Votes proposal addToken.
   * @param _token Token address to be added.
   * @param _pmctTokens PMCt amount to vote.
   */
  function voteProposalAddToken(address _token, uint256 _pmctTokens) public {
    require(_token != address(0), "Wrong token");
    require(proposalsAddToken[_token].votersTotal > 0, "No proposal");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);
    
    proposalsAddToken[_token].votersTotal = proposalsAddToken[_token].votersTotal.add(1);
    proposalsAddToken[_token].tokensTotal = proposalsAddToken[_token].tokensTotal.add(_pmctTokens);
    proposalsAddToken[_token].tokensOfVoter[msg.sender] = proposalsAddToken[_token].tokensOfVoter[msg.sender].add(_pmctTokens);
    
    emit ProposalVoted(msg.sender, ProposalType.addToken, _token);

    _checkAndAcceptProposalAddToken(_token);
  }

  /**
   * @dev Checks if proposal addToken should be accepted and accepts if needed.
   * @param _token Token address to be added.
   */
  function _checkAndAcceptProposalAddToken(address _token) private {
    if (proposalsAddToken[_token].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsAddToken[_token].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameAddToken(_token);
    }
  }
  //  ADD, VOTE ADD TOKEN -->


  //  <-- QUIT PROPOSAL
  /**
   * @dev Quits proposal.
   * @param _proposalType Proposal type.
   */
  function quitProposal(ProposalType _proposalType) external onlyValidProposal(_proposalType) {
    if (_proposalType == ProposalType.minStake) {
      _quitProposalMinStake();
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      _quitProposalGameMaxDuration();
    } else {
      _quitProposalAddToken();
    }
  }

  /**
   * @dev Quits proposal minStake.
   */
  function _quitProposalMinStake() private {
    uint256 votedValue = proposalMinStakeValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");
    
    proposalsMinStake[votedValue].votersTotal = proposalsMinStake[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsMinStake[votedValue].tokensOfVoter[msg.sender];
    proposalsMinStake[votedValue].tokensTotal = proposalsMinStake[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinStake[votedValue].tokensOfVoter[msg.sender];
    delete proposalMinStakeValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.minStake);
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
  
  /**
   * @dev Quits proposal addToken.
   */
  function _quitProposalAddToken() private {
    address votedValue = proposalAddTokenValueParticipated[msg.sender];
    require(votedValue != address(0), "No votes");

    proposalsAddToken[votedValue].votersTotal = proposalsAddToken[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsAddToken[votedValue].tokensOfVoter[msg.sender];
    proposalsAddToken[votedValue].tokensTotal = proposalsAddToken[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsAddToken[votedValue].tokensOfVoter[msg.sender];
    delete proposalAddTokenValueParticipated[msg.sender];

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
    if (_proposalType == ProposalType.minStake) {
      return proposalsMinStakeValues.length;
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      return proposalsGameMaxDurationValues.length;
    } else {
      return proposalsAddTokenValues.length;
    }
  }

  /**
   * @dev Gets proposal info.
   * @param _proposalType Proposal type.
   * @param _value Proposal value.
   * @return votersTotal Votes total for proposal.
   * @return tokensTotal PMCt total for proposal.
   * @return tokensOfVoter PMCt of sender for proposal.
   */
  function getProposalInfo(ProposalType _proposalType, address _token, uint256 _value) external view onlyValidProposal(_proposalType) returns (uint256 votersTotal, uint256 tokensTotal, uint256 tokensOfVoter) {
    if (_proposalType == ProposalType.minStake) {
      require(proposalsMinStake[_value].votersTotal > 0, "No proposal");
      
      votersTotal = proposalsMinStake[_value].votersTotal;
      tokensTotal = proposalsMinStake[_value].tokensTotal;
      tokensOfVoter = proposalsMinStake[_value].tokensOfVoter[msg.sender];
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      require(proposalsGameMaxDuration[_value].votersTotal > 0, "No value");
      
      votersTotal = proposalsGameMaxDuration[_value].votersTotal;
      tokensTotal = proposalsGameMaxDuration[_value].tokensTotal;
      tokensOfVoter = proposalsGameMaxDuration[_value].tokensOfVoter[msg.sender];
    } else {
      require(proposalsAddToken[_token].votersTotal > 0, "No proposal");
      
      votersTotal = proposalsAddToken[_token].votersTotal;
      tokensTotal = proposalsAddToken[_token].tokensTotal;
      tokensOfVoter = proposalsAddToken[_token].tokensOfVoter[msg.sender];
    }
  }
}