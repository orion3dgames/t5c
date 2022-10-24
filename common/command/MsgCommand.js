import nengi from 'nengi'

class MsgCommand {
  constructor(type, message) {
    this.type = type
    this.message = JSON.stringify(message)
  }
}

MsgCommand.protocol = {
  type: nengi.UTF8String,
  message: nengi.UTF8String,
}

export default MsgCommand