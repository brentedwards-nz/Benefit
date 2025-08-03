import { ClubCardProps, ClubCard } from "../cards/club-card";

export interface ClubsProps {
  clubs: ClubCardProps[];
}

const Clubs = ({ clubs }: ClubsProps) => {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid gap-y-4">
        {clubs.map((club, index) => (
          <ClubCard
            key={index}
            club_id={club.club_id}
            club_address={club.club_address}
            club_name={club.club_name}
            club_avatar={club.club_avatar}
            club_phone={club.club_phone}
            current={club.current}
            disabled={club.current}
            created_at={club.created_at}
          />
        ))}
      </div>
    </div>
  );
};

export default Clubs;
