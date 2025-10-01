import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface CallbackReminderEmailProps {
  userName: string;
  prospects: Array<{
    email: string;
    company?: string;
    statut_prospect?: string;
    callback_date: string;
    notes_sales?: string;
  }>;
  appUrl: string;
}

export const CallbackReminderEmail = ({
  userName,
  prospects,
  appUrl,
}: CallbackReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Rappel : {prospects.length} prospect{prospects.length > 1 ? 's' : ''} à contacter aujourd'hui</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔔 Rappel de contacts</Heading>
        <Text style={text}>
          Bonjour {userName},
        </Text>
        <Text style={text}>
          Vous avez {prospects.length} prospect{prospects.length > 1 ? 's' : ''} à rappeler aujourd'hui :
        </Text>

        {prospects.map((prospect, index) => (
          <Section key={index} style={prospectCard}>
            <Text style={prospectEmail}>
              <strong>📧 {prospect.email}</strong>
            </Text>
            {prospect.company && (
              <Text style={prospectDetail}>
                🏢 Entreprise : {prospect.company}
              </Text>
            )}
            {prospect.statut_prospect && (
              <Text style={prospectDetail}>
                📊 Statut : <span style={badge}>{prospect.statut_prospect}</span>
              </Text>
            )}
            <Text style={prospectDetail}>
              📅 Date de rappel : {new Date(prospect.callback_date).toLocaleString('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
            {prospect.notes_sales && (
              <Text style={prospectDetail}>
                📝 Notes : {prospect.notes_sales}
              </Text>
            )}
          </Section>
        ))}

        <Hr style={hr} />

        <Link
          href={`${appUrl}/prospects/rappeler`}
          target="_blank"
          style={button}
        >
          Voir tous mes prospects à rappeler
        </Link>

        <Text style={footer}>
          Cet email a été envoyé automatiquement par votre système de gestion de prospects.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CallbackReminderEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const prospectCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 40px',
};

const prospectEmail = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const prospectDetail = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const badge = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
};

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  margin: '32px 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '24px 0 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};
