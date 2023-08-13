import React from 'react'
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Page, Button, RadioButton, LegacyStack, DropZone, Thumbnail, Text, Select, VerticalStack } from "@shopify/polaris";
import { NoteMinor } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks';
import { useNavigate } from '@shopify/app-bridge-react';



export default function TagUpdate() {

    const navigate = useNavigate();
    const fetchh = useAuthenticatedFetch();

    const [radioValue, setRadioValue] = useState();
    const [file, setFile] = useState();
    const [csvData, setCsvData] = useState();
    const [columnNames, setColumnNames] = useState([]);
    const [select1, setSelect1] = useState();
    const [select2, setSelect2] = useState();
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
                <Button disabled={!file} onClick={() => { setFile(''); setRadioValue(''); setSelect1(''); setSelect2(''); setColumnNames([]); setCsvData(''); setErrorMessage('') }} destructive>Reset</Button>
            </div>
        </LegacyStack>
    );

    const option = [];
    columnNames.forEach((column) => {
        option.push({ label: column, value: column });
    });

    const handleSelectChange1 = (value, id) => {
        setSelect1(value);
    };
    const handleSelectChange2 = (value, id) => {
        setSelect2(value);
    };

    const columns = (
        <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <div style={{ width: '40%' }}>
                <Select label={radioValue === "replacefromall" ? 'Old Tag Column' : 'SKU'} options={option} placeholder="--Select--" id="0" onChange={handleSelectChange1} value={select1} requiredIndicator="true" />
            </div>
            <div style={{ width: '40%' }}>
                <Select label={radioValue === "replacefromall" ? 'New Tag Column' : 'Tags'} options={option} placeholder="--Select--" id="1" onChange={handleSelectChange2} value={select2} requiredIndicator="true" />
            </div>
        </div>
    );

    const handleSubmit = async () => {
        const response = await fetchh('/api/getRunningstatus',{
            method: 'post',
            body: JSON.stringify({"storeName": localStorage.getItem("storeName")}),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();

        if (!result) {
            let csvDataUplaod = [];
            if (radioValue === "replacetags" || radioValue === "replacefromall" || radioValue === "addtags") {
                if (radioValue === "replacefromall") {
                    csvDataUplaod.push(['oldtags', 'tags']);
                }
                else {
                    csvDataUplaod.push(['sku', 'tags']);
                }
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
            } else {
                csvDataUplaod.push(["data"]);
                const column = csvData.map((row) => row[columnNames[0]]);
                for (let i = 0; i < column.length; i++) {
                    csvDataUplaod.push([column[i]]);
                }
            }
            csvDataUplaod = Papa.unparse(csvDataUplaod);
            Papa.parse(csvDataUplaod, {
                header: true,
                complete: async (results) => {
                    const result = await fetchh('/api/updateTagProduct', {
                        method: 'PATCH',
                        body: JSON.stringify({ "file": { "data": results.data, "name": file.name }, "update": radioValue, "storeName": localStorage.getItem("storeName") }),
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

    return (
        <Page narrowWidth>
            <VerticalStack inlineAlign="start">
                <RadioButton label="Replace all old tags with new tags through SKU" disabled={file} id="replacetags" checked={radioValue === 'replacetags'} onChange={handleRadioChange} />
                <RadioButton label="Replace a specific tag with another tag from all products" disabled={file} checked={radioValue === 'replacefromall'} id="replacefromall" onChange={handleRadioChange} />
                <RadioButton label="Add tags to existing tags through SKU" disabled={file} checked={radioValue === 'addtags'} id="addtags" onChange={handleRadioChange} />
                <RadioButton label="Delete all tags through SKU" disabled={file} checked={radioValue === 'deleteallfromsku'} id="deleteallfromsku" onChange={handleRadioChange} />
                <RadioButton label="Delete a specific tag from all products" disabled={file} checked={radioValue === 'deletetagfromall'} id="deletetagfromall" onChange={handleRadioChange} />

            </VerticalStack>
            {radioValue && uploadSection}
            {(radioValue === "replacetags" || radioValue === "replacefromall" || radioValue === "addtags") && file && columns}
            {((select1 !== '' && select2 !== '') || (radioValue === "deleteallfromsku" || radioValue === "deletetagfromall")) && file && submitButton}
        </Page>
    );
}
