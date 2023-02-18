import { useEffect, useState } from 'react';
import './App.css';
import abi from './contracts/abis/Tournaments.json';
const ethers = require('ethers');

const contractAddress = "0x2E4cf7ac461D6e6E502D46EE48b055c4f158281C";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [nActive, setNActive] = useState(0);
  const [playerGameState, setPlayerGameState] = useState();

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Couldn't find Metamask!")
      return
    } else {
      console.log("Metamask available")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Using account: ", account);
      setCurrentAccount(account);
    } else {
      console.log("No account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }

  const gameAction = async (type, i) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        if (type == "join") {
          await contract.joinGame(i);
        } else if (type == "exit") {
          await contract.exitGame(i)
        } else if (type == "end") {
          await contract.endGame(i)
        }
        console.log("gameAction", type, i)
      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      console.log(err);
    }
  }

  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  const showHeader = () => {
    return (
      <div>
        <p align="left">Using account: <i>{currentAccount}</i></p>
        <br></br>
        <br></br>
        <p><b><i>{nActive} active tournaments</i></b></p>
        <hr></hr>
      </div>
    )
  }

  const showGame = (i) => {
    if (!playerGameState) return (<div></div>)

    const gameName = playerGameState[i][0]
    const gameSize = playerGameState[i][1].toString()
    const currNPlayer = playerGameState[i][2].toString()
    const playerNum = playerGameState[i][3].toString()
    const gameOn = playerGameState[i][4]
    const winner = playerGameState[i][5] ? playerGameState[i][5].toLowerCase() : ""
    const status = gameOn ? "Game in progress" : `Last winner: ${winner == "0x0000000000000000000000000000000000000000" ? ("") : (winner == currentAccount ? "You" : winner)}`

    return (<div>
      <h1><u>{gameName}</u></h1>
      <p>Required number of players: {gameSize}</p>
      <p>{gameOn ? "" : `${currNPlayer} waiting in lobby`}</p>
      <button onClick={() => gameAction('join', i)} className='cta-button gameAction-button' disabled={gameOn || playerNum != 0}>
        Join Game
      </button>
      <button onClick={() => gameAction('exit', i)} className='cta-button gameAction-button' disabled={gameOn || playerNum == 0}>
        Exit Game
      </button>
      <button onClick={() => gameAction('end', i)} className='cta-button gameAction-button' disabled={!gameOn || playerNum == 0}>
        End Game
      </button>
      <p><i>{status}</i></p>
      <hr></hr>
    </div>)
  }

  const showAvailableTournaments = () => {
    return (
      <div>
        {showHeader()}
        {showGame(0)}
        {showGame(1)}
      </div>
    )
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const tournaments = new ethers.Contract(contractAddress, abi, signer);
      const nActive = (await tournaments.nActive()).toString()
      const playerGameState = await tournaments.getPlayerGameState()
      setNActive(nActive, 2000);
      setPlayerGameState(playerGameState, 1000);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className='main-app'>
      <div>
        {currentAccount ? showAvailableTournaments() : connectWalletButton()}
      </div>
    </div>
  )
}

export default App;
