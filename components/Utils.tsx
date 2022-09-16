import { VStack, Text, Box, Spinner, Button } from '@chakra-ui/react';
import React from 'react';

type LoadingPanelProps = {
  loadingMessage: string;
};
export function LoadingPanel(props: LoadingPanelProps) {
  return (
    <Box backgroundColor="app.300" borderRadius="lg" p={6} width="35%">
      <VStack spacing={'20%'}>
        <Text color="app.200" fontSize="xl" as="b" textAlign="center">
          {props.loadingMessage}
        </Text>
        <Spinner thickness="4px" speed="1s" color="app.200" size="xl" />
      </VStack>
    </Box>
  );
}

type SuccessPanelProps = {
  successMessage: string;
  proceedFunction?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  proceedFunctionMessage?: string;
};
export function SuccessPanel(props: SuccessPanelProps) {
  return (
    <VStack>
      <Box bg="success.100" borderRadius="lg" p={3} color="white">
        {props.successMessage}
      </Box>
      {props.proceedFunction && props.proceedFunctionMessage ? (
        <Button onClick={props.proceedFunction}>
          {props.proceedFunctionMessage}
        </Button>
      ) : null}
    </VStack>
  );
}

type FailurePanelProps = {
  failureMessage: string;
  proceedFunction: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  proceedFunctionMessage: string;
};
export function FailurePanel(props: FailurePanelProps) {
  return (
    <VStack>
      <Box bg="errors.100" borderRadius="lg" p={3} color="white">
        {props.failureMessage}
      </Box>
      <Button onClick={props.proceedFunction}>
        {props.proceedFunctionMessage}
      </Button>
    </VStack>
  );
}
