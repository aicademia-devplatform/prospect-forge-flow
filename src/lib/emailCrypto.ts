// Utilitaires pour crypter/décrypter les emails dans les URLs
const SALT = 'prospect_secure_2024'; // Salt pour ajouter de la sécurité

export const encryptEmail = (email: string): string => {
  try {
    // Ajouter le salt à l'email avant l'encodage
    const saltedEmail = `${SALT}:${email}`;
    // Encoder en base64 et remplacer les caractères problématiques pour les URLs
    return btoa(saltedEmail)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Error encrypting email:', error);
    return '';
  }
};

export const decryptEmail = (encryptedEmail: string): string => {
  try {
    // Restaurer les caractères base64
    let restored = encryptedEmail
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Ajouter le padding si nécessaire
    while (restored.length % 4) {
      restored += '=';
    }
    
    // Décoder
    const decoded = atob(restored);
    
    // Vérifier et retirer le salt
    if (decoded.startsWith(`${SALT}:`)) {
      return decoded.substring(SALT.length + 1);
    }
    
    throw new Error('Invalid encrypted email format');
  } catch (error) {
    console.error('Error decrypting email:', error);
    return '';
  }
};

export const createProspectUrl = (email: string): string => {
  const encryptedEmail = encryptEmail(email);
  return `/prospect/${encryptedEmail}`;
};

export const extractEmailFromUrl = (encryptedEmail: string): string => {
  return decryptEmail(decodeURIComponent(encryptedEmail));
};