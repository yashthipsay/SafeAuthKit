"use client"
import { useState, useEffect } from 'react';
import { useWaku } from "@waku/react";
import { createEncoder, createDecoder } from "@waku/sdk";
import protobuf from 'protobufjs';
const Waku = () => {

    const [inputMessage, setInputMessage] = useState("");
    const [messages, setMessages] = useState([]);

    // Update the inputMessage state as the user input changes
    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    // Create and start a Light Node
    const { node, error, isLoading } = useWaku();

    // Create a message encoder and decoder
    const contentTopic = "/waku-react-guide/1/chat/proto";
    const encoder = createEncoder({ contentTopic });
    const decoder = createDecoder(contentTopic);

    // Create a message structure using Protobuf
    const ChatMessage = new protobuf.Type("ChatMessage")
        .add(new protobuf.Field("timestamp", 1, "uint64"))
        .add(new protobuf.Field("message", 2, "string"));

    // Send the message using Light Push
    const sendMessage = async () => {}
  return (
    <>
            <div className="chat-interface">
                <h1>Waku React Demo</h1>
                <div className="chat-body">
                    {messages.map((message, index) => (
                        <div key={index} className="chat-message">
                            <span>{new Date(message.timestamp).toUTCString()}</span>
                            <div className="message-text">{message.message}</div>
                        </div>
                    ))}
                </div>
                <div className="chat-footer">
                    <input
                        type="text"
                        id="message-input"
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                    />
                    <button className="send-button" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </>
  )
}

export default Waku