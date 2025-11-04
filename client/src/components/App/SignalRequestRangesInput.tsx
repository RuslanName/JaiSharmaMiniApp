import { useState, useEffect } from 'react';
import { useInput, Labeled } from 'react-admin';
import { Box, Button, TextField, Typography, IconButton, Paper } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

export interface TimeRange {
    start: string;
    end: string;
}

interface SignalRequestRangesInputProps {
    source: string;
    label?: string;
}

export const SignalRequestRangesInput = ({ source, label }: SignalRequestRangesInputProps) => {
    const {
        field,
        fieldState: { error },
    } = useInput({ source });

    const [ranges, setRanges] = useState<TimeRange[]>([]);

    useEffect(() => {
        if (field.value) {
            try {
                const parsedValue = typeof field.value === 'string' 
                    ? JSON.parse(field.value) 
                    : field.value;
                if (Array.isArray(parsedValue)) {
                    setRanges(parsedValue);
                } else {
                    setRanges([]);
                }
            } catch (e) {
                setRanges([]);
            }
        } else {
            setRanges([]);
        }
    }, [field.value]);

    const updateRanges = (newRanges: TimeRange[]) => {
        setRanges(newRanges);
        field.onChange(newRanges);
    };

    const addRange = () => {
        const newRange: TimeRange = { start: '00:00', end: '23:59' };
        updateRanges([...ranges, newRange]);
    };

    const removeRange = (index: number) => {
        const newRanges = ranges.filter((_, i) => i !== index);
        updateRanges(newRanges);
    };

    const updateRange = (index: number, field: 'start' | 'end', value: string) => {
        const newRanges = [...ranges];
        newRanges[index] = { ...newRanges[index], [field]: value };
        updateRanges(newRanges);
    };

    return (
        <Labeled label={label || 'Диапазоны времени'} source={source} isRequired={false}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={addRange}
                        size="small"
                    >
                        Добавить диапазон
                    </Button>
                </Box>
                
                {ranges.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Нет добавленных диапазонов
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {ranges.map((range, index) => (
                            <Paper key={index} elevation={1} sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Начало"
                                        type="time"
                                        value={range.start}
                                        onChange={(e) => updateRange(index, 'start', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Конец"
                                        type="time"
                                        value={range.end}
                                        onChange={(e) => updateRange(index, 'end', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                        sx={{ flex: 1 }}
                                    />
                                    <IconButton
                                        color="error"
                                        onClick={() => removeRange(index)}
                                        aria-label="Удалить диапазон"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
                
                {error && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {error.message}
                    </Typography>
                )}
            </Box>
        </Labeled>
    );
};
