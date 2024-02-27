import { assert } from 'console';
import { Field, SmartContract, state, State, method, Struct, Poseidon } from 'o1js';
import { Field, SmartContract, state, State, method } from 'o1js';
import { Agent } from 'undici-types';

/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export class MessageAnalyzer extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  init() {
    super.init();
  }

  @method analyze(messages: Message[]) {
    for (let index = 0; index < messages.length; index++) {
      const element = messages[index];
      element.agentId.assertGreaterThanOrEqual(0);
      element.agentId.assertLessThanOrEqual(3000);
      element.agentXLocation.assertGreaterThanOrEqual(0);
      element.agentXLocation.assertLessThanOrEqual(15000);
      element.agentYLocation.assertLessThanOrEqual(20000);
      element.agentYLocation.assertGreaterThan(5000);
      element.agentYLocation.greaterThan(element.agentXLocation);
      const sum = element.agentId.add(element.agentXLocation).add(element.agentYLocation);
      element.checksum.assertEquals(sum);
    }
  }
}


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
}
