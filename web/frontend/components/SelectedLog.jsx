import React from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Page, DescriptionList, Frame, Loading, Text, LegacyCard, List, ResourceList, ResourceItem } from "@shopify/polaris";
import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from '@shopify/app-bridge-react';
import '../components/chats.css';

export default function SelectedLog(props) {
    const [log, setLog] = useState();
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
    const fetchh = useAuthenticatedFetch();

    useEffect(() => {
        get();
    }, []);

    const get = async () => {
        setIsLoading(true);
        const response = await fetchh('/api/fetchLogsRefresh', {
            method: 'post',
            body: JSON.stringify({ "storeName": localStorage.getItem("storeName") }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const refresData = await response.json();
        const logDetail = props.searchParams.get('log');

        refresData.map((data) => {
            if (data.start_time.substring(0, 19) === logDetail.substring(0, 19)) {
                setLog(data);
            }
        });
        setIsLoading(false);
    }

    const deleteLog = async () => {
        setIsLoading(true);
        const request = await fetchh("/api/deleteLog", {
            method: 'delete',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "start_time": log.start_time, "storeName": localStorage.getItem("storeName") })
        });
        setTimeout(() => {
            navigate('/logs');
        }, 1000);
    }

    const loadingMarkup = isLoading ? (
        <LegacyCard>
            <Frame>
                <Loading />
            </Frame>
        </LegacyCard>
    ) : null;

    return (
        <Page backAction={{ url: '/logs' }} title="Log Details">
            {loadingMarkup}
            {!isLoading && log && <LegacyCard actions={[{ content: 'Delete Log', destructive: true, onAction: deleteLog }, { content: 'Refresh', onAction: get }]}>
                <div style={{ padding: "20px" }}><DescriptionList
                    items={[
                        {
                            term: <Text variant="bodyMd" fontWeight="bold">{log.finish_time.substring(0, 19)}</Text>,
                            description: <Text variant="bodyMd" fontWeight="bold">Quota Consumed: {log.count}</Text>
                        },
                        {
                            term: 'Status',
                            description: <Text variant="bodyMd">{log.status}- Total Processed : {log.count + log.error.count}, Total Updates : {log.count} Total Ignored : {log.error.count}</Text>
                        },
                        {
                            term: 'Errors',
                            description: log.error.count ? <ResourceList
                                resourceName={{ singular: 'customer', plural: 'customers' }}
                                items={log.error.message}
                                renderItem={(item) => {
                                    return (
                                        <ResourceItem>
                                            <Text variant="bodyMd" as="h3">
                                                {item}
                                            </Text>
                                        </ResourceItem>
                                    );
                                }}
                            /> : <Text variant="bodyMd">No errors</Text>
                        },
                        {
                            term: <Text variant="bodyMd" fontWeight="bold">{log.start_time.substring(0, 19)}</Text>,
                            description: <Text variant="bodyMd">File processing started</Text>
                        }
                    ]}
                /></div>
            </LegacyCard>}
            <div className='info-box'>
                <p>For more details on configuration help, visit our <a href='https://www.mabbonz.com/mabbonz-tags-prices-app/'> documentation</a>.</p>
            </div>
        </Page>
    )
}
