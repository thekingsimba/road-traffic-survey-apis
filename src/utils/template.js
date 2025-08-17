export const dynamic_template_data = (data) => {
  const mail_data = {
    from: {
      email: "info@findchow.co.uk",
    },
    personalizations: [
      {
        to: {
          email: data.email,
        },
        dynamic_template_data: data.data,
      },
    ],
    template_id: data.template_id,
  };

  return mail_data;
};
