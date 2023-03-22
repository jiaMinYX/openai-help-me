import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import {LoadingOutlined} from '@ant-design/icons'
import { Configuration, OpenAIApi } from "openai";
import Draggable from 'react-draggable';
import {apiKeyStorage} from './constanst.js'
import './result-modal.css'

let _openAI = null
async function getOpenAIInstance () {
    if (!_openAI) {
        const storageResult = await chrome.storage.local.get(apiKeyStorage)
        const apiKey = storageResult[apiKeyStorage]
        const configuration = new Configuration({apiKey});
        _openAI = new OpenAIApi(configuration);
    }
    return _openAI
}

async function askOpenAI(question) {
    const openAI = await getOpenAIInstance()
    const response = await openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{"role": "user", "content": question}]
    });
    return response.data.choices[0].message.content
}

function ResultModal ({question, afterClose}) {
    const [open, setOpen] = useState(true);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef(null);

    useEffect(() => {
        setLoading(true)
        askOpenAI(question).then(answer => setResult(answer)).finally(() => setLoading(false))
    }, [])

    const handleCancel = (e) => {
        setOpen(false);
    };

    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    return  <Modal
                afterClose={afterClose}
                destroyOnClose={true}
                mask={false}
                maskClosable={false}
                style={{
                    cursor: 'move',
                }}
                wrapClassName="open-ai-result-modal-wrap"
                title="OpenAI:"
                open={open}
                footer={null}
                onCancel={handleCancel}
                modalRender={(modal) => (
                    <Draggable
                        bounds={bounds}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
            >
                {
                loading
                    ? <LoadingOutlined/>
                    : <pre style={{whiteSpace: 'pre-wrap'}}>
                        {result}
                    </pre>
                }
            </Modal>;
};

export default ResultModal;
