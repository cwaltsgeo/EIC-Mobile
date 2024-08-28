import { useContext } from 'react';
import styled from 'styled-components';
import { DataSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

const Section = styled.section`
  height: 100%;
  width: 100%;
  overflow: auto;
  display: flex;
`;

const Container = styled.div`
  padding: 0;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    display: none;
  }
`;

const Text = styled.p`
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    display: none;
  }
`;

export default function Data() {
    const { currentJSON } = useContext(CurrentJSONContext);
    const { dataSelection } = useContext(DataSelectionContext);

    if (!currentJSON) {
        return <div>Loading...</div>;
    }

    return (
        <Section>
            <Container>
                <Title>{currentJSON.name || 'No name'}</Title>
                <Subtitle>{currentJSON.description || 'No description'}</Subtitle>
                <Text>{currentJSON.tour[dataSelection[1]].text || 'No text'}</Text>
            </Container>
        </Section>
    );
}
