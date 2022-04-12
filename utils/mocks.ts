import { Option, Participant, Vote } from "@prisma/client";

export const generateFakeParticipants = (names: string[], dates: string[]) => {
  const pollId = "mock";

  const options: Option[] = dates.map((date) => {
    return {
      id: date,
      value: date,
      pollId,
    };
  });

  const participants: Array<Participant & { votes: Vote[] }> = names.map(
    (name, i) => {
      return {
        name,
        id: `participant${i}`,
        pollId,
        userId: null,
        createdAt: new Date(),
        votes: [],
      };
    },
  );

  const mockVotes: number[][] = [
    [1, 1, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 1, 1],
    [0, 0, 1, 0],
  ];

  const optionsWithVotes: Array<Option & { votes: Vote[] }> = options.map(
    (option, optionIndex) => {
      const votes: Vote[] = [];
      participants.map((participant, participantIndex) => {
        if (mockVotes[participantIndex][optionIndex]) {
          const vote: Vote = {
            id: participant.id + option.id,
            participantId: participant.id,
            optionId: option.id,
            pollId,
          };
          votes.push(vote);
          participant.votes.push(vote);
        }
      });
      return { ...option, votes };
    },
  );

  let highScore = 0;

  optionsWithVotes.forEach((option) => {
    if (option.votes.length > highScore) {
      highScore = option.votes.length;
    }
  });

  return { participants, options: optionsWithVotes, highScore };
};
