import React from 'react'
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Page, Button, RadioButton, LegacyStack, DropZone, Thumbnail, Text, Select, VerticalStack, TextField, Link } from "@shopify/polaris";
import { NoteMinor } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks';
import { useNavigate } from '@shopify/app-bridge-react';


export default function PriceUpdate() {

  const navigate = useNavigate();
  const fetchh = useAuthenticatedFetch();

  const [radioValue, setRadioValue] = useState('');
  const [file, setFile] = useState();
  const [csvData, setCsvData] = useState();
  const [columnNames, setColumnNames] = useState([]);
  const [select1, setSelect1] = useState();
  const [select2, setSelect2] = useState();
  const [amountValue, setAmountValue] = useState();
  const [percentageValue, setPercentageValue] = useState();
  const [errorMessage, setErrorMessage] = useState();



  const handleRadioChange = useCallback((_, newValue) => setRadioValue(newValue), [],);

  const uploadedFile = file && (
    <LegacyStack spacing="extraTight" distribution="center">
      <Thumbnail size="small" alt={file.name} source={NoteMinor} />
      <div>
        {file.name.substring(0, 12) + "..."}
        <Text variant="bodySm" as="p">
          {file.size} bytes
        </Text>
      </div>
    </LegacyStack>
  );

  const handleDropZoneDrop = useCallback((files) => {
    setFile(files[0]);
    const file = files[0];
    setSelect1('');
    setSelect2('');
    setErrorMessage('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        setCsvData(results.data);
        setColumnNames(Object.keys(results.data[0]));
      }
    });
  },
    [],
  );

  const uploadSection = (
    <LegacyStack alignment="center" distribution='center'>
      <div style={{ width: 114, height: 114, margin: '30px' }}>
        <DropZone allowMultiple={false} accept=".csv" onDrop={handleDropZoneDrop}>
          {!file && <DropZone.FileUpload actionHint="Accepts .csv File only." />}
          {uploadedFile}
        </DropZone>
      </div>
      <div>
        <Button disabled={!file} onClick={() => { setFile(''); setRadioValue(''); setSelect1(''); setSelect2(''); setColumnNames([]); setCsvData(''); setAmountValue(''); setPercentageValue(''); setErrorMessage('') }} destructive>Reset</Button>
      </div>
    </LegacyStack>
  );

  const option = [];
  columnNames.forEach((column) => {
    option.push({ label: column, value: column });
  })

  const handleSelectChange1 = (value, id) => {
    setSelect1(value);
  }
  const handleSelectChange2 = (value, id) => {
    setSelect2(value);
  }

  const columns = (
    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
      <div style={{ width: '40%' }}>
        <Select label='SKU' options={option} placeholder="--Select--" id="0" onChange={handleSelectChange1} value={select1} requiredIndicator="true" />
      </div>
      <div style={{ width: '40%' }}>
        <Select label='Price' options={option} placeholder="--Select--" id="1" onChange={handleSelectChange2} value={select2} requiredIndicator="true" />
      </div>
    </div>
  );

  const handleSubmit = async () => {
    const response = await fetchh('/api/getRunningstatus', {
      method: 'post',
      body: JSON.stringify({ "storeName": localStorage.getItem("storeName") }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();

    if (!result) {

      let csvDataUplaod = [];
      csvDataUplaod.push(['sku', 'price']);
      const column1 = csvData.map((row) => row[select1]);
      const column2 = csvData.map((row) => row[select2]);
      let count;
      for (count = 0; count < column1.length; count++) {
        csvDataUplaod.push([column1[count], column2[count]]);
      }
      if (count > 2000) {
        setErrorMessage("Number of products should be less than or equal to 2000.");
        return;
      }
      csvDataUplaod = Papa.unparse(csvDataUplaod);
      Papa.parse(csvDataUplaod, {
        header: true,
        complete: async (results) => {
          const result = await fetchh('/api/updatePriceProduct', {
            method: 'PATCH',
            body: JSON.stringify({ "file": { "data": results.data, "name": file.name }, "update": radioValue, "amount": amountValue, "percentage": percentageValue, "storeName": localStorage.getItem("storeName") }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      });
      navigate('/logs');
    }
    else {
      setErrorMessage("Process running in background please wait!");
    }
  };

  const submitButton = (
    <div style={{ textAlign: "-webkit-center", margin: "20px" }}>
      <Button primary onClick={handleSubmit}>Submit</Button>
      <Text variant="headingMd" color="critical">{errorMessage}</Text>
    </div>
  )

  const handleAmountChange = useCallback(
    (newValue) => setAmountValue(newValue),
    [],
  );
  const handlePercentageChange = useCallback(
    (newValue) => setPercentageValue(newValue),
    [],
  );


  return (
    <Page narrowWidth>
      <VerticalStack inlineAlign="start" >
        <RadioButton label="Update price as it is in csv" disabled={amountValue || percentageValue || file} id="exact" checked={radioValue === 'exact'} onChange={handleRadioChange} />
        <LegacyStack alignment="center" wrap={false}>
          <RadioButton label="Update increased price" disabled={amountValue || percentageValue || file} checked={radioValue === 'increseprice'} id="increseprice" onChange={handleRadioChange} />
          {radioValue === 'increseprice' && <LegacyStack wrap={false} alignment="center">
            <Text>By</Text>
            <TextField type="number" disabled={percentageValue} value={amountValue} onChange={handleAmountChange} autoComplete="off" />
            <Text>Amount</Text>
            <TextField type="number" suffix='%' disabled={amountValue} value={percentageValue} onChange={handlePercentageChange} autoComplete="off" />
            <Text>Percentage</Text>
          </LegacyStack>}
        </LegacyStack>
        <LegacyStack alignment="center" wrap={false}>
          <RadioButton label="Update decresed price" disabled={amountValue || percentageValue || file} checked={radioValue === 'decreseprice'} id="decreseprice" onChange={handleRadioChange} />
          {radioValue === 'decreseprice' && <LegacyStack wrap={false} alignment="center">
            <Text>By</Text>
            <TextField type="number" disabled={percentageValue} value={amountValue} onChange={handleAmountChange} autoComplete="off" />
            <Text>Amount</Text>
            <TextField type="number" suffix='%' disabled={amountValue} value={percentageValue} onChange={handlePercentageChange} autoComplete="off" />
            <Text>Percentage</Text>
          </LegacyStack>}
        </LegacyStack>
      </VerticalStack>
      {(radioValue === 'exact' || (amountValue || percentageValue)) && uploadSection}
      {file && columns}
      {select1 && select2 && file && submitButton}
    </Page>
  );
}
