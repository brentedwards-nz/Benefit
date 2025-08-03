import { EmailCardProps, EmailCard } from "../cards/email-card";

export interface EmailProps {
  emails: EmailCardProps[];
}

const Emails = ({ emails }: EmailProps) => {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid gap-y-4">
        {emails.map((email, index) => (
          <EmailCard key={index} email={email.email} />
        ))}
      </div>
    </div>
  );
};

export default Emails;
