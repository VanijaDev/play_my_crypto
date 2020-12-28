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

    //  minBet
  mapping(address => uint256[]) public proposalsMinBetValueForToken;   //  token => values[]
  mapping(address => mapping(uint256 => Proposal)) public proposalsMinBetForToken;  //  token => (value => Proposal)
  mapping(address => MinBetVote) public proposalMinBetValueParticipated;   //  address => MinBetVote(token, value)
  
  //    gameMaxDuration
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
    require(keccak256(abi.encodePacked(ERC20(_pmct).symbol())) == keccak256(abi.encodePacked("PMCt")), "Wrong _pmct");
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
  function addProposal(ProposalType _proposalType, address _token, uint256 _value, uint256 _tokens) external onlyValidProposal(_proposalType) {
    require(_value > 0, "Wrong value");
    
      if (_proposalType == ProposalType.minBet) {
          _addProposalMinBet(_token, _value, _tokens);
      } else if (_proposalType == ProposalType.gameMaxDuration) {
          _addProposalGameMaxDuration(_value, _tokens);
      } else {
          _addProposalAddToken(_token, _tokens);
      }
  }

  //  <-- ADD, VOTE MIN BET
  /**
   * @dev Adds proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalMinBet(address _token, uint256 _minBet, uint256 _tokens) private {
    require(proposalMinBetValueParticipated[msg.sender].value == 0 || proposalMinBetValueParticipated[msg.sender].token == _token, "Already voted");
    
    (proposalsMinBetForToken[_token][_minBet].votersTotal == 0) ? _createProposalMinBet(_token, _minBet, _tokens) : voteProposalMinBet(_token, _minBet, _tokens);
  }

  /**
   * @dev Creates proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalMinBet(address _token, uint256 _minBet, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(proposalsMinBetForToken[_token][_minBet].votersTotal == 0, "Already exists");
    
    proposalsMinBetValueForToken[_token].push(_minBet);
    proposalMinBetValueParticipated[msg.sender] = MinBetVote(_token, _minBet);

    proposalsMinBetForToken[_token][_minBet].votersTotal = 1;
    proposalsMinBetForToken[_token][_minBet].tokensTotal = _tokens;
    proposalsMinBetForToken[_token][_minBet].tokensOfVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.minBet, _token);
  }

  /**
   * @dev Votes proposal minBet.
   * @param _minBet minBet value.
   * @param _tokens PMCt amount to vote.
   */
  function voteProposalMinBet(address _token, uint256 _minBet, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(proposalsMinBetForToken[_token][_minBet].votersTotal > 0, "No proposal");
    require(_minBet > 0, "Wrong minBet");
  
      proposalsMinBetForToken[_token][_minBet].votersTotal = proposalsMinBetForToken[_token][_minBet].votersTotal.add(1);
      proposalsMinBetForToken[_token][_minBet].tokensTotal = proposalsMinBetForToken[_token][_minBet].tokensTotal.add(_tokens);
      proposalsMinBetForToken[_token][_minBet].tokensOfVoter[msg.sender] = proposalsMinBetForToken[_token][_minBet].tokensOfVoter[msg.sender].add(_tokens);
    
      ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
      emit ProposalVoted(msg.sender, ProposalType.minBet, _token);
      
      _checkAndAcceptProposaMinBet(_token, _minBet);
  }

  /**
   * @dev Checks if proposal minBet should be accepted and accepts if needed.
   * @param _minBet minBet value.
   */
  function _checkAndAcceptProposaMinBet(address _token, uint256 _minBet) private {
    if (proposalsMinBetForToken[_token][_minBet].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
    if (proposalsMinBetForToken[_token][_minBet].tokensTotal < tokensToAccept) {
      return;
    }

    for (uint8 i = 0; i < games.length; i++) {
      PMCGovernanceCompliant(games[i]).updateGameMinBet(_token, _minBet);
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
    
    (proposalsGameMaxDuration[_blocks].votersTotal == 0) ? _createProposalGameMaxDuration(_blocks, _tokens) : voteProposalGameMaxDuration(_blocks, _tokens);
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

    emit ProposalAdded(msg.sender, ProposalType.gameMaxDuration, address(0));
  }

  /**
   * @dev Votes proposal gameMaxDuration.
   * @param _blocks blocks duration value.
   * @param _tokens PMCt amount to vote.
   */
  function voteProposalGameMaxDuration(uint256 _blocks, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(proposalsGameMaxDuration[_blocks].votersTotal > 0, "No proposal");
    require(_blocks > 0, "Wrong duration");
    
    proposalsGameMaxDuration[_blocks].votersTotal = proposalsGameMaxDuration[_blocks].votersTotal.add(1);
    proposalsGameMaxDuration[_blocks].tokensTotal = proposalsGameMaxDuration[_blocks].tokensTotal.add(_tokens);
    proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender] = proposalsGameMaxDuration[_blocks].tokensOfVoter[msg.sender].add(_tokens);
    
    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
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

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
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
   * @param _tokens PMCt amount to vote.
   */
  function _addProposalAddToken(address _token, uint256 _tokens) private {
    require(proposalAddTokenValueParticipated[msg.sender] == address(0) || proposalAddTokenValueParticipated[msg.sender] == _token, "Already voted");
    
    (proposalsAddToken[_token].votersTotal == 0) ? _createProposalAddToken(_token, _tokens) : voteProposalGameMaxDuration(_token, _tokens);
  }

  /**
   * @dev Creates proposal addToken.
   * @param _token Token address to be added.
   * @param _tokens PMCt amount to vote.
   */
  function _createProposalAddToken(address _token, uint256 _tokens) private onlyAllowedTokens(_tokens) {
    require(_token != address(0), "Wrong token");
    require(proposalsAddToken[_token].votersTotal == 0, "Already exists");

    proposalsAddTokenValues.push(_token);
    proposalAddTokenValueParticipated[msg.sender] = _token;

    proposalsAddToken[_token].votersTotal = 1;
    proposalsAddToken[_token].tokensTotal = _tokens;
    proposalsAddToken[_token].tokensOfVoter[msg.sender] = _tokens;

    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);

    emit ProposalAdded(msg.sender, ProposalType.addToken, _token);
  }

  /**
   * @dev Votes proposal addToken.
   * @param _token Token address to be added.
   * @param _tokens PMCt amount to vote.
   */
  function voteProposalAddToken(address _token, uint256 _tokens) public onlyAllowedTokens(_tokens) {
    require(_token != address(0), "Wrong token");
    require(proposalsAddToken[_token].votersTotal > 0, "No proposal");
    
    proposalsAddToken[_token].votersTotal = proposalsAddToken[_token].votersTotal.add(1);
    proposalsAddToken[_token].tokensTotal = proposalsAddToken[_token].tokensTotal.add(_tokens);
    proposalsAddToken[_token].tokensOfVoter[msg.sender] = proposalsAddToken[_token].tokensOfVoter[msg.sender].add(_tokens);
    
    ERC20(pmct).transferFrom(msg.sender, address(this), _tokens);
    
    emit ProposalVoted(msg.sender, ProposalType.addToken, _token);

    _checkAndAcceptProposalAddToken(_token);
  }

  /**
   * @dev Checks if proposal addToken should be accepted and accepts if needed.
   * @param _token Token address to be added.
   */
  function _checkAndAcceptProposalAddToken(address _token) private {
      
      
    //   struct Proposal {
    //     uint256 votersTotal; //  individual voters
    //     uint256 tokensTotal;
    //     mapping(address => uint256) tokensOfVoter;
    //   }
  
//   address[] public proposalsAddTokenValues;
//   mapping(address => address) public proposalAddTokenValueParticipated;
//   mapping(address => Proposal) public proposalsAddToken;
  
  
    if (proposalsAddToken[_token].votersTotal < MIN_VOTERS_TO_ACCEPT_PROPOSAL) {
      return;
    }

    uint256 tokensToAccept = ERC20(pmct).totalSupply().mul(MIN_TOKENS_MINTED_PERCENT_TO_ACCEPT_PROPOSAL).div(100);
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
  function quitProposal(ProposalType _proposalType, address _token) external onlyValidProposal(_proposalType) {
      if (_proposalType == ProposalType.minBet) {
           _quitProposalMinBet(_token);
      } else if (_proposalType == ProposalType.gameMaxDuration) {
          _quitProposalGameMaxDuration();
      } else {
          //    TODO: addToken
      }
  }

  /**
   * @dev Quits proposal minBet.
   */
  function _quitProposalMinBet(address _token) private {
    uint256 votedValue = proposalMinBetValueParticipated[msg.sender].value;
    require(votedValue > 0, "No votes");
    
    proposalsMinBetForToken[_token][votedValue].votersTotal = proposalsMinBetForToken[_token][votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsMinBetForToken[_token][votedValue].tokensOfVoter[msg.sender];
    proposalsMinBetForToken[_token][votedValue].tokensTotal = proposalsMinBetForToken[_token][votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsMinBetForToken[_token][votedValue].tokensOfVoter[msg.sender];
    delete proposalMinBetValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.minBet, _token);
  }

  /**
   * @dev Quits proposal gameMaxDuration.
   */
  function _quitProposalGameMaxDuration() private {
      
    //   struct Proposal {
    //     uint256 votersTotal; //  individual voters
    //     uint256 tokensTotal;
    //     mapping(address => uint256) tokensOfVoter;
    //   }
    
    uint256 votedValue = proposalGameMaxDurationValueParticipated[msg.sender];
    require(votedValue > 0, "No votes");

    proposalsGameMaxDuration[votedValue].votersTotal = proposalsGameMaxDuration[votedValue].votersTotal.sub(1);
    uint256 tokensVoted = proposalsGameMaxDuration[votedValue].tokensOfVoter[msg.sender];
    proposalsGameMaxDuration[votedValue].tokensTotal = proposalsGameMaxDuration[votedValue].tokensTotal.sub(tokensVoted);
    delete proposalsGameMaxDuration[votedValue].tokensOfVoter[msg.sender];
    delete proposalGameMaxDurationValueParticipated[msg.sender];

    ERC20(pmct).transfer(msg.sender, tokensVoted);

    emit ProposalQuitted(msg.sender, ProposalType.gameMaxDuration, address(0));
  }


  //  QUIT PROPOSAL -->
  /**
   * @dev Gets proposals count.
   * @param _proposalType Proposal type.
   * @return Count of proposals.
   */
  function getProposalsCount(ProposalType _proposalType, address _token) external view onlyValidProposal(_proposalType) returns(uint256) {
      if (_proposalType == ProposalType.minBet) {
           return proposalsMinBetValueForToken[_token].length;
      } else if (_proposalType == ProposalType.gameMaxDuration) {
          return proposalsGameMaxDurationValues.length;
      } else {
          //    TODO: addToken
          return 0;
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
    if (_proposalType == ProposalType.minBet) {
      require(proposalsMinBetForToken[_token][_value].votersTotal > 0, "No proposal");
      
      votersTotal = proposalsMinBetForToken[_token][_value].votersTotal;
      tokensTotal = proposalsMinBetForToken[_token][_value].tokensTotal;
      tokensOfVoter = proposalsMinBetForToken[_token][_value].tokensOfVoter[msg.sender];
    } else if (_proposalType == ProposalType.gameMaxDuration) {
      require(proposalsGameMaxDuration[_value].votersTotal > 0, "No value");
      
      votersTotal = proposalsGameMaxDuration[_value].votersTotal;
      tokensTotal = proposalsGameMaxDuration[_value].tokensTotal;
      tokensOfVoter = proposalsGameMaxDuration[_value].tokensOfVoter[msg.sender];
    } else {
        //    TODO: addToken
    }
  }
}