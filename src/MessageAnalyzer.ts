import { Field, SmartContract, state, State, method, Struct, Poseidon, Bool, Provable } from 'o1js';
import { empty } from 'o1js/dist/node/bindings/mina-transaction/gen/transaction';
import { Gadgets } from 'o1js/dist/node/lib/gadgets/gadgets';


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

  process(): Field {

    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    if (this.agentId.equals(0)) {
      return this.messageNumber;
    }

    // Agent ID (should be between 0 and 3000)
    if (this.agentId.greaterThan(0)) {
      if (this.agentId.lessThanOrEqual(Field(3000))) {
        //Agent XLocation (should be between 0 and 15000) Agent YLocation
        if (this.agentXLocation.greaterThanOrEqual(0)) {
          if (this.agentXLocation.lessThanOrEqual(Field(15000))) {
            // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
            if (this.agentYLocation.greaterThan(this.agentXLocation)) {
              if (this.agentYLocation.greaterThanOrEqual(Field(5000))) {
                if (this.agentYLocation.lessThanOrEqual(Field(20000))) {
                  // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
                  const sum = this.agentId.add(this.agentXLocation).add(this.agentYLocation);
                  if (sum.equals(this.checksum)) {
                    return this.messageNumber;
                  }
                }
              }
            }
          }
        }
      }
    }
    return Field.empty();
  }

  isCorrect(): Bool {
    // If Agent ID is zero we don't need to check the other values, but this is still a valid message
    if (this.agentId.equals(0)) {
      return Bool(true);
    }

    // Agent ID (should be between 0 and 3000)
    if (this.agentId.greaterThan(0)) {
      if (this.agentId.lessThanOrEqual(Field(3000))) {
        //Agent XLocation (should be between 0 and 15000) Agent YLocation
        if (this.agentXLocation.greaterThanOrEqual(0)) {
          if (this.agentXLocation.lessThanOrEqual(Field(15000))) {
            // Agent YLocation (should be between 5000 and 20000) Agent YLocation should be greater than Agent XLocation
            if (this.agentYLocation.greaterThan(this.agentXLocation)) {
              if (this.agentYLocation.greaterThanOrEqual(Field(5000))) {
                if (this.agentYLocation.lessThanOrEqual(Field(20000))) {
                  // CheckSum is the sum of Agent ID , Agent XLocation,and Agent YLocation
                  const sum = this.agentId.add(this.agentXLocation).add(this.agentYLocation);
                  return (sum.equals(this.checksum));
                }
              }
            }
          }
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
    // let newMsg = value;
    // if (value.messages.length > 200) {
    //   // throw Error("More than 200 messages");
    // }
    // else if (value.messages.length < 200) {
    //   // we fill with empty message to get 200 messages
    //   const nb = 200 - value.messages.length;
    //   const emptyMessage = new Message({ messageNumber: Field.empty(), agentId: Field.empty(), agentXLocation: Field.empty(), agentYLocation: Field.empty(), checksum: Field.empty() });
    //   for (let index = 0; index < nb; index++) {
    //     value.messages.push(emptyMessage);
    //   }

    // }
    super(value);
  }
}

export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(msg: Message200) {
    let lastId = this.maxMessageNumber.getAndRequireEquals();

    for (let index = 0; index < 200; index++) {
      const element = msg.messages[index];
      // In case the message number is not greater than the previous one, this means that this is a duplicate message
      lastId = Provable.if(element.messageNumber.greaterThan(lastId),
        Provable.if(element.isCorrect(), element.messageNumber, lastId), lastId);
    }
    // store the bigest id never evaluated
    this.maxMessageNumber.set(lastId);
  }
}


