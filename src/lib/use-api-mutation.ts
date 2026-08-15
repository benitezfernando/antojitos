import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, APIError } from './api-client';

interface UseApiMutationOptions<TInput, TOutput> {
  path: string | ((input: TInput) => string);
  method: 'POST' | 'PUT' | 'DELETE';
  successMessage: string | ((data: TOutput, input: TInput) => string);
  onSuccess?: (data: TOutput, input: TInput) => void;
}

export function useApiMutation<TInput = unknown, TOutput = unknown>(
  options: UseApiMutationOptions<TInput, TOutput>,
): UseMutationResult<TOutput, APIError, TInput> {
  const queryClient = useQueryClient();

  return useMutation<TOutput, APIError, TInput>({
    mutationFn: async (input: TInput) => {
      const path = typeof options.path === 'function' ? options.path(input) : options.path;
      const init: RequestInit = { method: options.method };
      if (options.method !== 'DELETE') {
        init.body = JSON.stringify(input);
      }
      return apiFetch<TOutput>(path, init);
    },
    onSuccess: (data, input) => {
      const message = typeof options.successMessage === 'function'
        ? options.successMessage(data, input)
        : options.successMessage;
      toast.success(message);
      queryClient.invalidateQueries();
      options.onSuccess?.(data, input);
    },
    onError: (error) => {
      toast.error(error instanceof APIError ? error.message : 'Error desconocido');
    },
  });
}
