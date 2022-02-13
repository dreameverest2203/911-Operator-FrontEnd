import axios from 'axios';
 
import React,{Component} from 'react';
import './App.css';
import Button from '@material-ui/core/Button';
import MapContainer from './MapContainer';

class App extends Component {
  
    state = {
 
      // Initially, no file is selected
      selectedFile: null,
      transcription: null,
      lat: 37.4275,
      lng: -122.1697,
      raw_ner: null,
    };
    
    // On file select (from the pop up)
    onFileChange = event => {
    
      // Update the state
      this.setState({ selectedFile: event.target.files[0] });
    
    };
    
    // On file upload (click the upload button)
    onFileUpload = () => {
    
      // Create an object of formData
      const formData = new FormData();
    
      // Update the formData object
      formData.append(
        "myFile",
        this.state.selectedFile,
        this.state.selectedFile.name
      );
    
      // Details of the uploaded file
      console.log(this.state.selectedFile);
    
      // Request made to the backend api
      // Send formData object
      axios.post('http://localhost:5000/transcribe', formData)
      .then(res => {
        this.setState({transcription: res.data});
        if (res.data) {
          const transcriptionData = new FormData()
          transcriptionData.append(
            "transcription",
            res.data,
          )
          axios.post('http://localhost:5000/recognize', transcriptionData)
          .then(
            res_ner => {
              this.setState({raw_ner: res_ner})
            }
          )
        }
      }); 
      // const transcriptionData = new FormData()
      // transcriptionData.append(
      //   "transcription",
      //   "HELLO HELLO HELLO",
      // )
      // axios.post('http://localhost:5000/recognize', transcriptionData)
      // .then(
      //   res_ner => {
      //     this.setState({raw_ner: res_ner})
      //   }
      // );      
    };
    
    // File content to be displayed after
    // file upload is complete
    fileData = () => {
    
      if (this.state.selectedFile) {
        return (
          <div>
            <h2 className='center'>File Details:</h2>
             
              <p className='center'>File Name: {this.state.selectedFile.name}</p>
              
                          
              <p className='center'>File Type: {this.state.selectedFile.type}</p>
              
                          
              <p className='center'>
              Last Modified:{" "}
              {this.state.selectedFile.lastModifiedDate.toDateString()}
            </p>
 
          </div>
        );
      } else {
        return (
          <div className='center'>
            <br />
            <h4>Choose before Pressing the Upload button</h4>
          </div>
        );
      }
    };

    getTranscription = () => {
    
      if (this.state.transcription) {
         
        return (
          <div>
            <h2 className='center'>File Transcription:</h2>
             
              <p className='center' id='text-margin'>{this.state.transcription}</p>
 
          </div>
        );
      } else {
        return (
          <div className='center'>
          </div>
        );
      }
    };

    getNER = () => {
      if (this.state.raw_ner) {
        console.log(this.state.raw_ner)
      }
    }

    getMap = () => {
      return (
        <div className='center'>
          <MapContainer className='center' lat={this.state.lat} lng={this.state.lng}></MapContainer>
        </div>
      ) 
    }
    
    render() {
    
      return (
        <div>
            <h1 className='center'>
              911 Operator Assistant
            </h1>
            <h3 className='center'>
              Upload audio file
            </h3>
            <div className='center'>
                <Button variant="contained" component="label" id='button-margin'>
                  Upload File
                <input type="file" hidden onChange={this.onFileChange} />
                </Button>
                <Button variant="contained" onClick={this.onFileUpload}>
                  Upload!
                </Button>
            </div>
          {this.fileData()}
          {this.getTranscription()}
          {this.getNER()}
          {this.getMap()}
        </div>
      );
    }
  }
 
  export default App;