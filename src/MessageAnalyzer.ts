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

  empty(): Message {
    return new Message({
      messageNumber: Field.empty(),
      agentId: Field.empty(),
      agentXLocation: Field.empty(),
      agentYLocation: Field.empty(),
      checksum: Field.empty()
    });
  }

  isCorrect(): Bool {
    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    if (this.agentId == Field.empty()) {
      return Bool(true);
    }

    // Agent ID (should be between 0 and 3000)
    if (this.agentId > Field.empty() && this.agentId <= Field(3000)) {
      //Agent XLocation (should be between 0 and 15000) Agent YLocation
      if (this.agentXLocation >= Field.empty() && this.agentXLocation <= Field(15000)) {
        // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
        if (this.agentYLocation > this.agentXLocation && this.agentYLocation >= Field(5000) && this.agentYLocation <= Field(20000)) {
          // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
          const sum = this.agentId.add(this.agentXLocation).add(this.agentYLocation);
          return Bool(sum == this.checksum);
        }
      }
    }
    return Bool(false);
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
    super(value);
  }

  getMaxId(): Field {
    let lastId = Field.empty();

    for (let index = 0; index < this.messages.length; index++) {
      const element = this.messages[index];
      if (element.messageNumber.greaterThan(lastId) && element.isCorrect()) {
        lastId = element.messageNumber;
      }

    }

    return lastId;
  }
}

export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(msg: Message200) {
    let lastId = this.maxMessageNumber.getAndRequireEquals();
    const maxId = msg.getMaxId();
    maxId.assertGreaterThan(lastId);
    this.maxMessageNumber.set(maxId);
  }
}
