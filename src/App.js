import React, { Component } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      response: {
        messages: []
      }
    }
    this.validate = this.validate.bind(this)
  }
  validate (e) {
    let filetype = e.target.files[0].type
    readFile(e.target.files[0])
      .then(codeToValidate => {
        switch (filetype) {
          case 'text/css':
            this.validateCSS(codeToValidate)
              .then(response => this.setState({response: response}))
            break
          case 'text/html':
            this.validateHTML(codeToValidate)
              .then(response => this.setState({response: response}))
            break
          default:
            break
        }
      })
  }
  validateHTML (codeToValidate) {
    return window.fetch('https://validator.w3.org/nu/?out=json', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'text/html'
      },
      body: codeToValidate
    })
      .then(resp => resp.json())
  }
  validateCSS (codeToValidate) {
    return window.fetch('https://jigsaw.w3.org/css-validator/validator?profile=css3&output=soap12&text=' + encodeURIComponent(codeToValidate))
      .then(resp => resp.text())
      .then(text => {
        let parser = new window.DOMParser()
        return parser.parseFromString(text, 'application/xml')
      })
      .then(xml => {
        let errors = xml.getElementsByTagName('m:error')
        let response = {
          messages: []
        }
        for (let error of errors) {
          let message = {
            message: error.getElementsByTagName('m:message')[0].innerHTML,
            lastLine: error.getElementsByTagName('m:line')[0].innerHTML,
            type: error.getElementsByTagName('m:errortype')[0].innerHTML
          }
          response.messages.push(message)
        }
        return response
      })
  }
  render () {
    return (
      <div style={{
        width: '90%',
        margin: '1em auto'
      }}>
        <ValidatorFileDrop validate={this.validate} />
        <ValidatorMessageList response={this.state.response} />
      </div>
    )
  }
}
// hate this
function readFile (file) {
  return new Promise((resolve, reject) => {
    let reader = new window.FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsText(file)
  })
}

class ValidatorMessageList extends Component {
  render () {
    return (
      <div style={{
        height: '50vh',
        overflowY: 'scroll'
      }}>
        {this.props.response.messages.map((message, i) => (
          <ValidatorMessage key={i} msg={message} />
        ))
        }
      </div>
    )
  }
}

const ValidatorFileDrop = (props) => (
  <form style={{
    width: '50%',
    margin: '2em auto',
    backgroundColor: '#875fd7',
    borderRadius: '5px'
  }}>
    <input style={{
      padding: '2em'
    }} type='file' name='file' onChange={props.validate} />
  </form>
)

const ValidatorMessage = (props) => (
  <div><b>{props.msg.lastLine && <span>line {props.msg.lastLine}: </span>}{props.msg.type}</b><p>{props.msg.message}</p></div>
)

export default App
