import React, { useEffect } from 'react';
import { useState, useCallback } from 'react';
import { Page, Button, LegacyCard, ButtonGroup, Loading, Frame, Icon, Text } from "@shopify/polaris";
import { useAuthenticatedFetch } from '../hooks';
import TagUpdate from './TagUpdate';
import PriceUpdate from './PriceUpdate';
import '../components/chats.css';

export default function Home() {

  const [activeButtonIndex, setActiveButtonIndex] = useState('');
  const [isLoading, setIsLoading] = useState();

  const fetchh = useAuthenticatedFetch();

  useEffect(() => {
    const fecthdata = async () => {
      setIsLoading(true);
      const response = await fetchh("/api/fetchStoreData");
      const result = await response.json();

      localStorage.setItem("storeName", result.data);

      const responsesku = await fetchh("/api/productFetch", {
        method: 'post',
        body: JSON.stringify({ "storeName": localStorage.getItem("storeName") }),
        headers: {
          'Content-Type': 'application/json'
        },
      });
      setIsLoading(false);
    }
    fecthdata();
  }, []);

  const handleButtonClick = useCallback((index) => {
    if (activeButtonIndex === index) return;
    setActiveButtonIndex(index);
  },
    [activeButtonIndex],
  );

  const loadingMarkup = isLoading ? (
    <LegacyCard>
      <Frame>
        <Loading />
      </Frame>
    </LegacyCard>
  ) : null;

  return (
    <Page fullWidth title="Update Tags and Prices">
      {loadingMarkup}
      {!isLoading && <LegacyCard title="Choose" sectioned>
        <ButtonGroup fullWidth="true" >
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <div style={{ width: '30%' }}>
              <Button pressed={activeButtonIndex === 0} onClick={() => handleButtonClick(0)}>Update Tags</Button>
            </div>
            <div style={{ width: '30%' }}>
              <Button pressed={activeButtonIndex === 1} onClick={() => handleButtonClick(1)}>Update Price</Button>
            </div>
          </div>
        </ButtonGroup>
        {activeButtonIndex === 0 && <TagUpdate />}
        {activeButtonIndex === 1 && <PriceUpdate />}
      </LegacyCard>}

      <div className='info-box'>
        <p>For more details on configuration help, visit our <a target="_blank" href='https://www.mabbonz.com/mabbonz-tags-prices-app/'> documentation</a>.</p>
      </div>
    </Page>
  )
}
