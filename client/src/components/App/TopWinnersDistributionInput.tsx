import { useState, useEffect } from 'react';
import { useInput, Labeled } from 'react-admin';
import { Box, TextField, Typography, Paper, InputAdornment } from '@mui/material';

export interface CountryDistribution {
    INDIA: number;
    BANGLADESH: number;
    PAKISTAN: number;
    SRI_LANKA: number;
}

interface TopWinnersDistributionInputProps {
    source: string;
    label?: string;
}

const COUNTRY_LABELS: Record<keyof Omit<CountryDistribution, 'INDIA'>, string> = {
    BANGLADESH: 'Бангладеш',
    PAKISTAN: 'Пакистан',
    SRI_LANKA: 'Шри-Ланка',
};

export const TopWinnersDistributionInput = ({ source, label }: TopWinnersDistributionInputProps) => {
    const {
        field,
        fieldState: { error },
    } = useInput({ source });

    const [distribution, setDistribution] = useState<CountryDistribution>({
        INDIA: 50,
        BANGLADESH: 25,
        PAKISTAN: 13,
        SRI_LANKA: 12,
    });

    useEffect(() => {
        if (field.value) {
            try {
                const parsedValue = typeof field.value === 'string' 
                    ? JSON.parse(field.value) 
                    : field.value;
                if (parsedValue && typeof parsedValue === 'object') {
                    setDistribution({
                        INDIA: parsedValue.INDIA || 0,
                        BANGLADESH: parsedValue.BANGLADESH || 0,
                        PAKISTAN: parsedValue.PAKISTAN || 0,
                        SRI_LANKA: parsedValue.SRI_LANKA || 0,
                    });
                }
            } catch (e) {}
        }
    }, [field.value]);

    const updateDistribution = (country: keyof Omit<CountryDistribution, 'INDIA'>, value: number) => {
        const newDistribution = { ...distribution };
        newDistribution[country] = Math.max(0, Math.min(100, value));

        const othersSum = newDistribution.BANGLADESH + newDistribution.PAKISTAN + newDistribution.SRI_LANKA;
        newDistribution.INDIA = Math.max(0, 100 - othersSum);
        
        setDistribution(newDistribution);
        field.onChange(JSON.stringify(newDistribution));
    };

    const othersSum = distribution.BANGLADESH + distribution.PAKISTAN + distribution.SRI_LANKA;
    const total = distribution.INDIA + othersSum;

    return (
        <Labeled label={label || 'Распределение топ-победителей'} source={source} isRequired={false}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(Object.keys(COUNTRY_LABELS) as Array<keyof typeof COUNTRY_LABELS>).map((country) => (
                        <Paper key={country} elevation={1} sx={{ p: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 120 }}>
                                    {COUNTRY_LABELS[country]}
                                </Typography>
                                <TextField
                                    type="number"
                                    value={distribution[country]}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10) || 0;
                                        updateDistribution(country, value);
                                    }}
                                    size="small"
                                    inputProps={{ 
                                        min: 0, 
                                        max: 100,
                                        step: 1,
                                        style: { 
                                            textAlign: 'center',
                                            padding: '4px 8px',
                                            height: '28px'
                                        }
                                    }}
                                    sx={{ flex: 1, maxWidth: 150 }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        sx: {
                                            height: '36px',
                                            '& input': {
                                                textAlign: 'center',
                                                padding: '4px 8px',
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Paper>
                    ))}
                    
                    <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                                <Typography sx={{ fontWeight: 'medium' }}>
                                    Индия
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Вычисляется автоматически
                                </Typography>
                            </Box>
                            <TextField
                                type="number"
                                value={distribution.INDIA}
                                disabled
                                size="small"
                                sx={{ maxWidth: 100 }}
                                inputProps={{
                                    style: { 
                                        textAlign: 'center',
                                        padding: '4px 8px',
                                        height: '28px'
                                    }
                                }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    sx: {
                                        height: '36px',
                                        '& input': {
                                            textAlign: 'center',
                                            padding: '4px 8px',
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color={total === 100 ? 'success.main' : 'error.main'}>
                        Всего: {total}%
                    </Typography>
                </Box>
                
                {error && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {error.message}
                    </Typography>
                )}
            </Box>
        </Labeled>
    );
};

