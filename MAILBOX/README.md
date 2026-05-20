# Agent Mailbox System

Each agent has a dedicated inbox. To send a message, write a file named:
  `MAILBOX/<recipient>/msg_<timestamp>_from_<sender>.md`

Messages must include:
- **FROM:** agent name
- **TO:** agent name  
- **SUBJECT:** brief topic
- **BODY:** message content

Agents poll their own mailbox directory for new messages before each action.
