import React, { useEffect } from 'react';
import { useState, useCallback } from 'react';
import { Page, Button, LegacyCard, ButtonGroup, Loading, Frame } from "@shopify/polaris";
import { useAuthenticatedFetch } from '../hooks';
import TagUpdate from './TagUpdate';
import PriceUpdate from './PriceUpdate';

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
    <Page fullWidth title="Price Tag Updator App">
      {loadingMarkup}
      {!isLoading && <LegacyCard title="Update" sectioned>
        <ButtonGroup fullWidth="true" >
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <div style={{ width: '30%' }}>
              <Button pressed={activeButtonIndex === 0} onClick={() => handleButtonClick(0)}>Upadate Tags</Button>
            </div>
            <div style={{ width: '30%' }}>
              <Button pressed={activeButtonIndex === 1} onClick={() => handleButtonClick(1)}>Update Price</Button>
            </div>
          </div>
        </ButtonGroup>
        {activeButtonIndex === 0 && <TagUpdate />}
        {activeButtonIndex === 1 && <PriceUpdate />}
      </LegacyCard>}
    </Page>
  )
}
