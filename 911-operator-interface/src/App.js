import axios from 'axios';

import React,{Component} from 'react';
import Recorder from 'recorder-js';
import './App.css';
import Button from '@material-ui/core/Button';
import MapContainer from './MapContainer';

var recorder = null;
var audioStream = null;

class App extends Component {
  constructor(props) {
    super(props);
    this.mic = React.createRef();

    this.accessMic = this.accessMic.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);

    this.stopAccessingMic = this.stopAccessingMic.bind(this);
    this.getTextFromGoogle = this.getTextFromGoogle.bind(this);

  }

    state = {

      // Initially, no file is selected
      selectedFile: null,
      transcription: null,
      lat: 37.4275,
      lng: -122.1697,
      raw_ner: null,
      emergency: null,
      isMicActive: false
    };

    accessMic() {
      if (!this.state.isMicActive) {
        return;
      }

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      recorder = new Recorder(audioContext);

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(this.handleSuccess)
        .catch(err => console.log('Uh oh... unable to get stream...', err));

      setTimeout(() => {this.stopAccessingMic(); this.accessMic()}, 5000);
    }

    handleSuccess(stream) {
      audioStream = stream;

      recorder.init(stream);
      recorder.start();
    }

    getTextFromGoogle(blob) {
      let filename = new Date().toISOString();
      let xhr = new XMLHttpRequest();
      xhr.onload = function(e) {
        if (this.readyState === 4) {
          console.log(e.target.responseText);
        }
      };
      let formData = new FormData();
      const myFile = new File([blob], filename, {type: blob.type});
      formData.append('myFile', myFile, filename);
      formData.append('noPunctuation', true)
      xhr.open('POST', 'http://localhost:5000/transcribe', true);
      xhr.send(formData);
    }

    handleClick() {
      const isMicActive = this.state.isMicActive;

      this.state.isMicActive = !isMicActive;

      if (!isMicActive) {
        this.checkPermissions();
        this.accessMic();
      } else {
        this.stopAccessingMic();
      }
    }

    stopAccessingMic() {
      audioStream && audioStream.getTracks()[0].stop();
      recorder.stop().then(({ blob, buffer }) => {
        this.getTextFromGoogle(blob);
      });
    }

    checkPermissions() {
      navigator.permissions
        .query({ name: 'microphone' })
        .then(permissionObj => {
          console.log('Permission status - ', permissionObj.state);
        })
        .catch(error => {
          console.log('Permission status - Got error :', error);
        });
    }

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
              if (this.state.raw_ner) {

                formData.append(
                  "location",
                  this.state.raw_ner.data.address
                );
                axios.post('http://localhost:5000/coordinates', formData)
                .then(res => {
                  this.setState({lat: res.data.lat});
                  this.setState({lng: res.data.lng});
                });

              }
            }
          )
          axios.post('http://localhost:5000/emergency', transcriptionData)
          .then(
            res_emergency => {
              this.setState({emergency: res_emergency.data.emergency})
            }
          )
        }
      });
    };

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
              <div className='new-line center'>{this.state.transcription.replaceAll(".", "\n")}</div>
              {/* <p className='center' id='text-margin'>{this.state.transcription.split(".").map((item) => {item}<br></br> )}</p> */}

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
        return (
          <div>
              <h2 className='center'>Named Entities Found: </h2>

              <p className='center' id='text-margin'>Address: {this.state.raw_ner.data.address}</p>

          </div>
        )
      }
    }
    getEmergency = () => {
      if (this.state.emergency) {
        return (
          <div>
              <p className='center' id='text-margin'>Emergency: {this.state.emergency}</p>

          </div>
        )
      }
    }

    getMap = () => {
      return (
        <div className='center'>
          <MapContainer className='center' lat={this.state.lat} lng={this.state.lng} isMarkerShown={true} />
        </div>
      )
    }

    getMicButton() {
      return (<div
        id='mic'
        ref={this.mic}
        onClick={this.handleClick}
        className={
          this.state.isMicActive ? 'mic-btn mic-btn-active' : 'mic-btn'
        }
      >
        <button>Mic Check</button>
      </div>);
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
          {this.getEmergency()}
          {this.getMap()}
          <br></br>
          {this.getMicButton()}
        </div>
      );
    }
  }

  export default App;