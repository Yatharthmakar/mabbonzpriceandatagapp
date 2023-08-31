import { Card, EmptyState, Page } from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { notFoundImage } from "../assets";
import { useNavigate } from '@shopify/app-bridge-react';

export default function NotFound() {
  const navigate = useNavigate();
  navigate('/');
  const { t } = useTranslation();
  return (
    <Page>
      <Card>
        <Card.Section>
          <EmptyState heading={t("NotFound.heading")} image={notFoundImage}>
            <p>{t("NotFound.description")}</p>
          </EmptyState>
        </Card.Section>
      </Card>
    </Page>
  );
}
