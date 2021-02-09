// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./PMCGovernanceCompliant.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
    uint256 startedAt;
    mapping(address => uint256) tokensOfVoter;
    mapping(address => uint256) voterVotedAt;
  }

  uint256 constant private MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL = 10;   //  amount of tokens for the proposal to be accepted
  uint16 constant private MIN_VOTERS_TO_ACCEPT_PROPOSAL = 2; // TODO: 1000;   //  amount of voters for the proposal to be accepted

  address pmct;
  address[] games;  //  game Smart Contracts to be governed

    //  minStake
  uint256[] public proposalsMinStakeValues; //  what if proposal removed or accepted? Should be removed from these lists?
  mapping(address => uint256) public proposalMinStakeValueParticipating; //  address => value
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

  event ProposalAdded(address indexed sender, ProposalType indexed proposalType, address indexed token);
  event ProposalVoted(address indexed sender, ProposalType indexed proposalType, address indexed token);
  event ProposalQuitted(address indexed sender, ProposalType indexed proposalType);


  /**
   * @dev Constructor.
   * @param _pmct PMCt address.
   * @param _game Game addresses, that should be governed by this Smart Contract. Games should be PMCGovernanceCompliant.
   */
  constructor(address _pmct, address _game) {
    require(_pmct != address(0), "Wrong _pmct");
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
    require(_proposalType <= ProposalType.addToken, "Wrong proposal");

    if (_proposalType == ProposalType.minStake) {
      _addProposalMinStake(_value, _pmctTokens);
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      require(_value > 0, "Wrong value");
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
    require(proposalMinStakeValueParticipating[msg.sender] == 0 || proposalMinStakeValueParticipating[msg.sender] == _minStake, "Already voted");

    (proposalsMinStake[_minStake].votersTotal == 0) ? _createProposalMinStake(_minStake, _pmctTokens) : voteProposalMinStake(_minStake, _pmctTokens);
  }

  /**
   * @dev Creates proposal minStake.
   * @param _minStake minStake value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _createProposalMinStake(uint256 _minStake, uint256 _pmctTokens) private {
    require(proposalsMinStake[_minStake].votersTotal == 0, "Already exists");
    require(_minStake > 0, "Wrong minStake");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);
    
    if (proposalsMinStake[_minStake].startedAt == 0) {
      proposalsMinStakeValues.push(_minStake);
    }

    proposalMinStakeValueParticipating[msg.sender] = _minStake;

    proposalsMinStake[_minStake].votersTotal = 1;
    proposalsMinStake[_minStake].tokensTotal = _pmctTokens;
    proposalsMinStake[_minStake].startedAt = block.timestamp;
    proposalsMinStake[_minStake].tokensOfVoter[msg.sender] = _pmctTokens;
    proposalsMinStake[_minStake].voterVotedAt[msg.sender] = block.timestamp;

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

    if (proposalsMinStake[_minStake].voterVotedAt[msg.sender] < proposalsMinStake[_minStake].startedAt) {
      delete proposalsMinStake[_minStake].tokensOfVoter[msg.sender];
      delete proposalsMinStake[_minStake].voterVotedAt[msg.sender];
    }
  
    proposalMinStakeValueParticipating[msg.sender] = _minStake;

    proposalsMinStake[_minStake].votersTotal = proposalsMinStake[_minStake].votersTotal.add(1);
    proposalsMinStake[_minStake].tokensTotal = proposalsMinStake[_minStake].tokensTotal.add(_pmctTokens);
    proposalsMinStake[_minStake].tokensOfVoter[msg.sender] = proposalsMinStake[_minStake].tokensOfVoter[msg.sender].add(_pmctTokens);
    proposalsMinStake[_minStake].voterVotedAt[msg.sender] = block.timestamp;
  
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

    delete proposalsMinStake[_minStake].votersTotal;
    delete proposalsMinStake[_minStake].tokensTotal;
  }
  //  ADD, VOTE MIN STAKE -->


  //  <-- ADD, VOTE GAME DURATION
  /**
   * @dev Adds proposal gameMaxDuration.
   * @param _duration blocks duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _addProposalGameMaxDuration(uint256 _duration, uint256 _pmctTokens) private {
    require(proposalGameMaxDurationValueParticipated[msg.sender] == 0 || proposalGameMaxDurationValueParticipated[msg.sender] == _duration, "Already voted");

    (proposalsGameMaxDuration[_duration].votersTotal == 0) ? _createProposalGameMaxDuration(_duration, _pmctTokens) : voteProposalGameMaxDuration(_duration, _pmctTokens);
  }

  /**
   * @dev Creates proposal gameMaxDuration.
   * @param _duration time duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function _createProposalGameMaxDuration(uint256 _duration, uint256 _pmctTokens) private {
    require(_duration > 0, "Wrong duration");
    require(proposalsGameMaxDuration[_duration].votersTotal == 0, "Already exists");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);

    if (proposalsGameMaxDuration[_duration].startedAt == 0) {
      proposalsGameMaxDurationValues.push(_duration);
    }

    proposalGameMaxDurationValueParticipated[msg.sender] = _duration;

    proposalsGameMaxDuration[_duration].votersTotal = 1;
    proposalsGameMaxDuration[_duration].tokensTotal = _pmctTokens;
    proposalsGameMaxDuration[_duration].startedAt = block.timestamp;
    proposalsGameMaxDuration[_duration].tokensOfVoter[msg.sender] = _pmctTokens;
    proposalsGameMaxDuration[_duration].voterVotedAt[msg.sender] = block.timestamp;

    emit ProposalAdded(msg.sender, ProposalType.gameMaxDuration, address(0));
  }

  /**
   * @dev Votes proposal gameMaxDuration.
   * @param _duration blocks duration value.
   * @param _pmctTokens PMCt amount to vote.
   */
  function voteProposalGameMaxDuration(uint256 _duration, uint256 _pmctTokens) public {
    require(proposalsGameMaxDuration[_duration].votersTotal > 0, "No proposal");
    require(_duration > 0, "Wrong duration");
    ERC20(pmct).transferFrom(msg.sender, address(this), _pmctTokens);

    if (proposalsGameMaxDuration[_duration].voterVotedAt[msg.sender] < proposalsGameMaxDuration[_duration].startedAt) {
      delete proposalsGameMaxDuration[_duration].tokensOfVoter[msg.sender];
      delete proposalsGameMaxDuration[_duration].voterVotedAt[msg.sender];
    }
    
    proposalsGameMaxDuration[_duration].votersTotal = proposalsGameMaxDuration[_duration].votersTotal.add(1);
    proposalsGameMaxDuration[_duration].tokensTotal = proposalsGameMaxDuration[_duration].tokensTotal.add(_pmctTokens);
    proposalsGameMaxDuration[_duration].tokensOfVoter[msg.sender] = proposalsGameMaxDuration[_duration].tokensOfVoter[msg.sender].add(_pmctTokens);
    proposalsGameMaxDuration[_duration].voterVotedAt[msg.sender] = block.timestamp;
    
    emit ProposalVoted(msg.sender, ProposalType.gameMaxDuration, address(0));

    _checkAndAcceptProposalGameMaxDuration(_duration);



    if (proposalsMinStake[_minStake].voterVotedAt[msg.sender] < proposalsMinStake[_minStake].startedAt) {
      delete proposalsMinStake[_minStake].tokensOfVoter[msg.sender];
      delete proposalsMinStake[_minStake].voterVotedAt[msg.sender];
    }
  
    proposalMinStakeValueParticipating[msg.sender] = _minStake;

    proposalsMinStake[_minStake].votersTotal = proposalsMinStake[_minStake].votersTotal.add(1);
    proposalsMinStake[_minStake].tokensTotal = proposalsMinStake[_minStake].tokensTotal.add(_pmctTokens);
    proposalsMinStake[_minStake].tokensOfVoter[msg.sender] = proposalsMinStake[_minStake].tokensOfVoter[msg.sender].add(_pmctTokens);
    proposalsMinStake[_minStake].voterVotedAt[msg.sender] = block.timestamp;
  
  }

  /**
   * @dev Checks if proposal gameMaxDuration should be accepted and accepts if needed..
   * @param _duration blocks duration value.
   */
  function _checkAndAcceptProposalGameMaxDuration(uint256 _duration) private {
    if (proposalsGameMaxDuration[_duration].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_pmctTokens_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsGameMaxDuration[_duration].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMaxDuration(uint16(_duration));
    }

    delete proposalsGameMaxDuration[_duration].votersTotal;
    delete proposalsGameMaxDuration[_duration].tokensTotal;
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
      PMCGovernanceCompliant(games[i]).updateGameAddTokenSupported(_token);
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
    uint256 votedValue = proposalMinStakeValueParticipating[msg.sender];
    require(votedValue > 0, "No votes");
    
    proposalsMinStake[votedValue].votersTotal = proposalsMinStake[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsMinStake[votedValue].tokensOfVoter[msg.sender];
    proposalsMinStake[votedValue].tokensTotal = proposalsMinStake[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinStake[votedValue].tokensOfVoter[msg.sender];
    delete proposalMinStakeValueParticipating[msg.sender];

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