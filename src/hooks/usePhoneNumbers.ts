import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PhoneNumberData {
  email: string;
  phones: string[];
  loading: boolean;
}

export const usePhoneNumbers = (emails: string[]) => {
  const [phoneData, setPhoneData] = useState<Record<string, PhoneNumberData>>(
    {}
  );

  useEffect(() => {
    if (emails.length === 0) return;

    // Initialiser avec loading true pour tous les emails
    const initialData: Record<string, PhoneNumberData> = {};
    emails.forEach((email) => {
      initialData[email] = { email, phones: [], loading: true };
    });
    setPhoneData(initialData);

    // Récupérer les numéros de téléphone pour chaque email
    const fetchPhones = async () => {
      const results = await Promise.all(
        emails.map(async (email) => {
          try {
            const { data, error } = await supabase.functions.invoke(
              "get-contact",
              {
                body: { email },
              }
            );

            if (error || !data?.success) {
              return { email, phones: [], loading: false };
            }

            // Extraire tous les numéros de téléphone disponibles
            const phones: string[] = [];
            data.data?.forEach((contact: any) => {
              const sourcePrefix = contact.source_table.replace(
                "_contacts",
                ""
              );

              // CRM phones
              if (contact.data.mobile) phones.push(contact.data.mobile);
              if (contact.data.tel) phones.push(contact.data.tel);
              if (contact.data.tel_pro) phones.push(contact.data.tel_pro);
              if (contact.data.mobile_2) phones.push(contact.data.mobile_2);

              // Apollo phones
              if (contact.data.mobile_phone)
                phones.push(contact.data.mobile_phone);
              if (contact.data.work_direct_phone)
                phones.push(contact.data.work_direct_phone);
              if (contact.data.company_phone)
                phones.push(contact.data.company_phone);
              if (contact.data.home_phone) phones.push(contact.data.home_phone);

              // HubSpot phones
              if (contact.data.phone) phones.push(contact.data.phone);
              if (contact.data.hs_calculated_phone_number)
                phones.push(contact.data.hs_calculated_phone_number);

              // Brevo phones
              if (contact.data.telephone) phones.push(contact.data.telephone);
            });

            // Dédupliquer et nettoyer
            const uniquePhones = [...new Set(phones)].filter(
              (phone) => phone && phone.trim() !== ""
            );

            return { email, phones: uniquePhones, loading: false };
          } catch (err) {
            console.error(`Error fetching phones for ${email}:`, err);
            return { email, phones: [], loading: false };
          }
        })
      );

      // Mettre à jour l'état avec les résultats
      const newData: Record<string, PhoneNumberData> = {};
      results.forEach((result) => {
        newData[result.email] = result;
      });
      setPhoneData(newData);
    };

    fetchPhones();
  }, [emails.join(",")]);

  return phoneData;
};

