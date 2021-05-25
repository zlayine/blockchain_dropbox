import DStorage from '../abis/DStorage.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

class App extends Component {

	async componentWillMount() {
		await this.loadWeb3()
		await this.loadBlockchainData()
	}

	async loadWeb3() {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum)
			await window.ethereum.enable()
		}
		else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider)
		}
		else {
			window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
		}
	}

	async loadBlockchainData() {
		//Declare Web3
		const web3 = window.web3;
		//Load account
		const accounts = await web3.eth.getAccounts();
		this.setState({
			...this.state,
			account: accounts[0],
		})
		//Network ID
		const networkId = await web3.eth.net.getId();
		const networkData = DStorage.networks[networkId];
		//IF got connection, get data from contracts
		if (networkData) {
			//Assign contract
			const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address);
			this.setState({
				...this.state,
				dstorage: dstorage
			})
			//Get files amount
			const fileCount = await dstorage.methods.fileCount().call();
			this.setState({
				...this.state,
				fileCount: fileCount
			})
			//Load files&sort by the newest
			for (let i = 1; i <= fileCount; i++) {
				const file = await dstorage.methods.files(i).call();
				this.setState({
					...this.state,
					files: [...this.state.files, file],
				})
			}
			this.setState({ ...this.state, loading: false })
		}
		else {
			alert("Contract not deployed to the current netwrok");
		}

	}

	// Get file from user
	captureFile = event => {
		event.preventDefault()

		const file = event.target.files[0]
		const reader = new window.FileReader()

		reader.readAsArrayBuffer(file)
		reader.onloadend = () => {
			this.setState({
				buffer: Buffer(reader.result),
				type: file.type,
				name: file.name
			})
			console.log('buffer', this.state.buffer)
		}
	}


	//Upload File
	uploadFile = description => {

		//Add file to the IPFS
		ipfs.add(this.state.buffer, (error, result) => {
			console.log('IPFS result', result[0].size)
			if (error) {
				console.error(error)
				return
			}
			this.setState({ ...this.state, loading: true })
			if(this.state.type === ''){
        this.setState({type: 'none'})
      }
			this.state.dstorage.methods.uploadFile(result[0].hash, result[0].size, this.state.type, this.state.name, description).send({ from: this.state.account }).on('transactionHash', () => {
				this.setState({
					...this.state,
					loading: false,
					type: null,
					name: null
				})
				window.location.reload();
			}).on('error', (e) => {
				window.alert('Error')
				this.setState({ loading: false })
			})
		})
	}

	//Set states
	constructor(props) {
		super(props)
		this.state = {
			account: '0x0',
			dstorage: {},
			fileCount: 0,
			files: [],
			loading: true,
		}

		//Bind functions
		this.uploadFile = this.uploadFile.bind(this)
    this.captureFile = this.captureFile.bind(this)
	}

	render() {
		return (
			<div>
				<Navbar account={this.state.account} />
				{ this.state.loading
					? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
					: <Main
						files={this.state.files}
						captureFile={this.captureFile}
						uploadFile={this.uploadFile}
					/>
				}
			</div>
		);
	}
}

export default App;