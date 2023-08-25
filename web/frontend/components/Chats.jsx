import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LegacyCard, Page, TextField, Button, Loading, Frame } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';
import './chats.css';

export default function Chats() {

    const [messageValue, setMessageValue] = useState();
    const [isLoading, setIsLoading] = useState();
    const [messages, setMessages] = useState();
    const chatWindowRef = useRef(null);

    const fetchh = useAuthenticatedFetch();

    const getChats = async () => {

        setIsLoading(true);
        const response = await fetchh("/api/getChats");
        const result = await response.json();
        setMessages(result);

        setIsLoading(false);
    };

    useEffect(() => {
        getChats();
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [isLoading]);

    const handleTextFieldChange = useCallback(
        (value) => setMessageValue(value),
        [],
    );

    const handleSubmit = async () => {
        if (!messageValue) {
            return;
        };

        setIsLoading(true);
        await fetchh("/api/setChats", {
            method: 'post',
            body: JSON.stringify({ "message": messageValue }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const response = await fetchh("/api/getChats");
        const result = await response.json();
        setMessages(result);
        setMessageValue('');
        setIsLoading(false);
    };

    const loadingMarkup = isLoading ? (
        <LegacyCard>
            <Frame>
                <Loading />
            </Frame>
        </LegacyCard>
    ) : null;

    return (
        <Page narrowWidth title='Chat with app Admin'>
            {loadingMarkup}
            {!isLoading && <LegacyCard actions={[{ content: 'Refresh Chats', onAction: getChats }]}>
                <div className='box' ref={chatWindowRef}>
                    {messages?.map((message) => {
                        return (
                            <div style={{ display: 'flex' }} key={message.time}>
                                {message.sender != 'Admin' && <div className='adminIcon'></div>}
                                <div className='messagebox-admin'>
                                    <div>
                                        <b>{message.sender}</b>
                                    </div>
                                    {message.message}
                                    <div style={{ textAlignLast: 'right' }}>
                                        <small>{message.time.substring(0, 16)}</small>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <TextField value={messageValue} onChange={handleTextFieldChange} autoComplete="off" placeholder="Message" focused='true' connectedRight={<Button onClick={handleSubmit}>Send</Button>} />
            </LegacyCard>}
            <div className='info-box'>
                <p>For more details on configuration help, visit our <a target="_blank" href='https://www.mabbonz.com/mabbonz-tags-prices-app/'> documentation</a>.</p>
            </div>
        </Page>
    )
}
