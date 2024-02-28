import { Field, SmartContract, state, State, method, Struct, Poseidon, Bool, Provable } from 'o1js';


export class Message extends Struct({
  messageNumber: Field,
  agentId: Field,
  agentXLocation: Field,
  agentYLocation: Field,
  checksum: Field
}) {
  constructor(value: {
    messageNumber: Field,
    agentId: Field,
    agentXLocation: Field,
    agentYLocation: Field,
    checksum: Field
  }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.messageNumber,
      this.agentId,
      this.agentXLocation,
      this.agentYLocation,
      this.checksum,
    ]);
  }

  process(lastId: Field): Field {
    const zero = Field.empty();
    console.log("lastId", lastId);
    // In case the message number is not greater than the previous one, this means that this is a duplicate message
    if (this.messageNumber.lessThanOrEqual(lastId)) {
      console.log("isCorrect", false);
      return lastId;
    }
    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    if (this.agentId == zero) {
      return this.messageNumber;
    }

    // Agent ID (should be between 0 and 3000)
    if (this.agentId > zero && this.agentId <= Field(3000)) {
      //Agent XLocation (should be between 0 and 15000) Agent YLocation
      if (this.agentXLocation >= zero && this.agentXLocation <= Field(15000)) {
        // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
        if (this.agentYLocation > this.agentXLocation && this.agentYLocation >= Field(5000) && this.agentYLocation <= Field(20000)) {
          // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
          const sum = this.agentId.add(this.agentXLocation).add(this.agentYLocation);
          if (sum == this.checksum) {
            return this.messageNumber;
          }
        }
      }
    }
    return lastId;
  }
}


export class Message200 extends Struct({
  messages: [
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message,
    Message, Message, Message, Message, Message, Message, Message, Message, Message, Message
  ]
}) {
  constructor(value: {
    messages: Message[]
  }) {
    let newMsg = value;
    if (value.messages.length > 200) {
      throw Error("More than 200 messages");
    }
    else if (value.messages.length < 200) {
      // we fill with empty message to get 200 messages
      const nb = 200 - value.messages.length;
      const emptyMessage = new Message({ messageNumber: Field.empty(), agentId: Field.empty(), agentXLocation: Field.empty(), agentYLocation: Field.empty(), checksum: Field.empty() });
      for (let index = 0; index < nb; index++) {
        value.messages.push(emptyMessage);
      }

    }
    super(newMsg);
  }
}

export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(msg: Message200) {
    let lastId = this.maxMessageNumber.getAndRequireEquals();
    for (let index = 0; index < msg.messages.length; index++) {
      const element = msg.messages[index];
      lastId = element.process(lastId);
      console.log("new last Id", lastId);
    }
    // store the bigest id never evaluated
    this.maxMessageNumber.set(lastId);
  }
}
