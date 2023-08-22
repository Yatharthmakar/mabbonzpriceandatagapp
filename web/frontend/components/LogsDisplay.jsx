import React from 'react'
import { useState, useEffect } from 'react';
import { Page, EmptyState, ResourceItem, ResourceList, Frame, Loading, Button, Thumbnail, Text, LegacyCard } from "@shopify/polaris";
import { PauseMajor, StatusActiveMajor } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks';
import '../components/chats.css';


export default function LogsDisplay(props) {

    const [isLoading, setIsLoading] = useState(true);
    const [logsData, setLogsData] = useState([]);
    const [allLogsData, setAllLogsData] = useState([]);

    const fetchh = useAuthenticatedFetch();

    const refreshLogs = async () => {
        setIsLoading(true);
        const response = await fetchh('/api/fetchLogsRefresh', {
            method: 'post',
            body: JSON.stringify({ "storeName": localStorage.getItem("storeName") }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const refresData = await response.json();
        setAllLogsData(refresData);
        setLogsData(refresData.slice(0, 3));
        setIsLoading(false);
    }

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            refreshLogs();
        }, 500);

    }, []);

    const deleteLogs = async () => {
        setIsLoading(true);
        const response = await fetchh('/api/deleteLogs', {
            method: 'delete',
            body: JSON.stringify({ "storeName": localStorage.getItem("storeName") }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        await refreshLogs();
        setAllLogsData([]);
        setLogsData([]);
        setIsLoading(false);
    }


    const loadingMarkup = isLoading ? (
        <LegacyCard>
            <Frame>
                <Loading />
            </Frame>
        </LegacyCard>
    ) : null;

    return (
        <Page title="Logs">
            {loadingMarkup}
            {!isLoading && logsData && <LegacyCard actions={[{ content: 'Delete All Logs', destructive: true, onAction: deleteLogs }, { content: 'Refresh', onAction: refreshLogs }]}>
                <LegacyCard.Section title="">
                    <ResourceList
                        resourceName={{ singular: 'log', plural: 'logs' }}
                        items={logsData}
                        emptyState={<EmptyState heading="Empty Logs: No file uploaded recently" image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"><p>Try refreshing the page!</p></EmptyState>}
                        renderItem={(item) => {
                            const { start_time, finish_time, file_name, status, update } = item;
                            const sTime = start_time.substring(0, 19);
                            const fTime = finish_time.substring(0, 19);
                            let textColor = "warning";
                            let tuhmbNail = PauseMajor;
                            const url = `/logs?${props.searchParams.toString()}&log=${start_time}`;
                            const shortcutActions = url
                                ? [
                                    {
                                        content: 'Details',
                                        accessibilityLabel: `View Upload Details`,
                                        url: url,
                                    },
                                ]
                                : null;

                            if (status !== "Pending") {
                                textColor = "success";
                                tuhmbNail = StatusActiveMajor;
                            }
                            return (
                                <ResourceItem
                                    id={start_time}
                                    url={url}
                                    media={<Thumbnail source={tuhmbNail} />}
                                    shortcutActions={shortcutActions}
                                >
                                    <Text color={textColor} variant="bodyMd" fontWeight="bold">'{file_name}'  Uploaded on: {sTime}</Text>
                                    <Text color={textColor} variant="bodyMd" as="h5">Status: {status}</Text>
                                    <Text color={textColor} variant="bodyMd" as="h5">Completed on: {fTime}</Text>
                                    <Text color={textColor} variant="bodyMd" as="h5">Update process: {update}</Text>
                                </ResourceItem>
                            );
                        }}
                    />
                    {!(allLogsData?.length === logsData?.length) && <Button onClick={() => { setLogsData(allLogsData) }}>Show All Logs</Button>}
                </LegacyCard.Section>
            </LegacyCard>}
            <div className='info-box'>
                <p>For more details on configuration help, visit our <a target="_blank" href='https://www.mabbonz.com/mabbonz-tags-prices-app/'> documentation</a>.</p>
            </div>
        </Page>

    )
}
